/**
 * Chat Tab — Mascot Chat Interface
 * Users log habits by chatting with Sprout.
 * Resembles a standard messaging app: mascot on left, user on right.
 * Integrates with the motivation service for dynamic tone and data logging.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from 'react-native-reanimated';
import Mascot from '@/components/Mascot';
import Typography from '@/components/ui/Typography';
import { Spacing, Radius, Shadows, FontFamily, FontSize } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  ChatMessage,
  getGreetingMessages,
  generateBotResponse,
  createUserMessage,
  getLastDetectedCategory,
  processHabitLoggingAsync,
} from '@/services/chatBot';
import {
  fetchMotivationScore,
  logMotivation,
  saveChatMessage,
  getMotivationGreeting,
  MotivationScore,
} from '@/services/motivation';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export default function ChatScreen() {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [motivationScore, setMotivationScore] = useState<MotivationScore | null>(null);
  const [userHabits, setUserHabits] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    // Fetch motivation score in the background
    const score = await fetchMotivationScore();
    setMotivationScore(score);

    // Fetch user habits for quick replies
    try {
      const habitsRes = await api.get<{ habits: any[] }>(API_ENDPOINTS.habits);
      if (habitsRes.data?.habits) {
        setUserHabits(habitsRes.data.habits);
      }
    } catch (e) {
      console.log('Failed to fetch habits for quick replies', e);
    }

    // Build greeting based on score
    const greetings = getGreetingMessages();

    // Override first greeting with motivation-aware message
    if (score) {
      const dynamicGreeting = getMotivationGreeting(score);
      greetings[0] = {
        ...greetings[0],
        text: dynamicGreeting,
      };
    }

    setIsTyping(true);
    setTimeout(() => {
      setMessages([greetings[0]]);
      setIsTyping(true);
    }, 500);

    setTimeout(() => {
      setMessages(greetings);
      setIsTyping(false);
    }, 1500);
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    // Add user message
    const userMsg = createUserMessage(text);
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    Keyboard.dismiss();
    scrollToBottom();

    // Persist user message to backend (fire and forget)
    saveChatMessage({ sender: 'user', message: text });

    // Detect difficulty ratings and log to motivation service
    const diffMatch = text.match(/[1-5]/);
    if (diffMatch && text.toLowerCase().includes('hard') || text.toLowerCase().includes('easy') || text.toLowerCase().includes('moderate') || diffMatch) {
      const category = getLastDetectedCategory();
      if (diffMatch) {
        logMotivation({
          habitCategory: category || undefined,
          difficultyRating: parseInt(diffMatch[0]),
        });
      }
    }

    // Detect mood keywords and log
    const moodKeywords: Record<string, string> = {
      'amazing': 'amazing', 'great': 'great', 'good': 'good',
      'tired': 'tired', 'struggling': 'struggling', 'tough': 'tough',
    };
    for (const [keyword, mood] of Object.entries(moodKeywords)) {
      if (text.toLowerCase().includes(keyword)) {
        logMotivation({ mood, habitCategory: getLastDetectedCategory() || undefined });
        break;
      }
    }

    // Show typing indicator, then respond
    setIsTyping(true);

    // Variable delay based on response length for natural feel
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const botResponses = generateBotResponse(text);

      // Check if a habit was detected and log it to the backend asynchronously
      const detectedHabit = botResponses.find((r) => r.habitDetected)?.habitDetected;
      if (detectedHabit) {
        processHabitLoggingAsync(detectedHabit);
      }

      // Add responses one by one with small delays
      botResponses.forEach((response, index) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, response]);
          scrollToBottom();

          // Persist bot message (fire and forget)
          saveChatMessage({ sender: 'mascot', message: response.text });

          // Hide typing after last message
          if (index === botResponses.length - 1) {
            setIsTyping(false);
          }
        }, index * 600);
      });
    }, delay);
  };

  const handleQuickReply = (reply: string) => {
    setInputText('');
    // Remove quick replies from the message that triggered them
    setMessages((prev) =>
      prev.map((msg) =>
        msg.quickReplies ? { ...msg, quickReplies: undefined } : msg,
      ),
    );

    // Treat as user message
    const userMsg = createUserMessage(reply);
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();

    // Bot responds
    setIsTyping(true);
    const delay = 600 + Math.random() * 500;
    setTimeout(() => {
      const botResponses = generateBotResponse(reply);
      
      const detectedHabit = botResponses.find((r) => r.habitDetected)?.habitDetected;
      if (detectedHabit) {
        processHabitLoggingAsync(detectedHabit);
      }

      botResponses.forEach((response, index) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, response]);
          scrollToBottom();
          if (index === botResponses.length - 1) {
            setIsTyping(false);
          }
        }, index * 600);
      });
    }, delay);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMascot = item.sender === 'mascot';
    const isLast = index === messages.length - 1;

    return (
      <Animated.View
        entering={isMascot ? FadeInLeft.duration(400) : FadeInRight.duration(400)}
      >
        <View style={[styles.messageRow, isMascot ? styles.mascotRow : styles.userRow]}>
          {/* Mascot avatar */}
          {isMascot && (
            <View style={styles.avatarContainer}>
              <Mascot mood="happy" size="sm" animated={false} />
            </View>
          )}

          {/* Bubble */}
          <View
            style={[
              styles.bubble,
              isMascot ? styles.mascotBubble : styles.userBubble,
            ]}
          >
            <Typography
              variant="body"
              color={isMascot ? Colors.white : Colors.text}
              style={styles.messageText}
            >
              {item.text}
            </Typography>

            {/* Timestamp */}
            <Typography
              variant="caption"
              color={isMascot ? 'rgba(255,255,255,0.6)' : Colors.textMuted}
              style={styles.timestamp}
            >
              {formatTime(item.timestamp)}
            </Typography>
          </View>
        </View>

        {/* Quick Replies */}
        {item.quickReplies && isLast && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.quickRepliesContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRepliesScroll}
            >
              {item.quickReplies.map((reply, i) => (
                <Pressable
                  key={i}
                  style={styles.quickReplyChip}
                  onPress={() => handleQuickReply(reply)}
                >
                  <Typography variant="bodySmall" color={Colors.text}>
                    {reply}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <Mascot mood="happy" size="sm" animated={false} />
            </View>
            <View>
              <Typography variant="h3">Sprout</Typography>
              <Typography variant="caption" color={isTyping ? Colors.accent : Colors.textMuted}>
                {isTyping ? 'typing...' : 'Your habit companion'}
              </Typography>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.onlineDot} />
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={
            isTyping ? <TypingIndicator styles={styles} /> : null
          }
        />

        {/* Habit Quick Replies (Dynamic) */}
        {userHabits.length > 0 && !isTyping && (
          <View style={styles.dynamicQuickRepliesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dynamicQuickRepliesScroll}>
              {userHabits.map((habit) => (
                <Pressable
                  key={habit.id}
                  style={styles.dynamicQuickReplyChip}
                  onPress={() => {
                    const text = `I completed my ${habit.name} habit today!`;
                    handleQuickReply(text);
                  }}
                >
                  <Typography variant="bodySmall" color={Colors.white}>
                    {habit.icon || '✅'} {habit.name}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Tell Sprout about your habits..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
          </View>
          <Pressable
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? Colors.text : Colors.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────

function TypingIndicator({ styles }: { styles: any }) {
  return (
    <Animated.View
      entering={FadeInLeft.duration(300)}
      style={styles.typingRow}
    >
      <View style={styles.typingAvatarContainer}>
        <Mascot mood="thinking" size="sm" animated={false} />
      </View>
      <View style={styles.typingBubble}>
        <TypingDots styles={styles} />
      </View>
    </Animated.View>
  );
}

function TypingDots({ styles }: { styles: any }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (sv: any, delay: number) => {
      sv.value = withDelay(
        delay,
        withSpring(1, { damping: 3, stiffness: 200 }, () => {
          sv.value = withDelay(200, withTiming(0, { duration: 300 }));
        }),
      );
    };

    const interval = setInterval(() => {
      animate(dot1, 0);
      animate(dot2, 200);
      animate(dot3, 400);
    }, 1200);

    // Initial animation
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);

    return () => clearInterval(interval);
  }, []);

  const d1 = useAnimatedStyle(() => ({ transform: [{ translateY: -dot1.value * 4 }] }));
  const d2 = useAnimatedStyle(() => ({ transform: [{ translateY: -dot2.value * 4 }] }));
  const d3 = useAnimatedStyle(() => ({ transform: [{ translateY: -dot3.value * 4 }] }));

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, d1]} />
      <Animated.View style={[styles.typingDot, d2]} />
      <Animated.View style={[styles.typingDot, d3]} />
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Styles ──────────────────────────────────────────────────────

const createStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlayLight,
    ...Shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.cardLight,
  },

  // Messages List
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  // Message Row
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  mascotRow: {
    alignSelf: 'flex-start',
  },
  userRow: {
    alignSelf: 'flex-end',
  },

  // Avatar
  avatarContainer: {
    width: 36,
    height: 36,
    marginRight: Spacing.sm,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bubbles
  bubble: {
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxWidth: '100%',
    flexShrink: 1,
  },
  mascotBubble: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: Colors.accent,
    borderTopRightRadius: 6,
  },
  messageText: {
    lineHeight: 22,
  },
  timestamp: {
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 10,
  },

  // Quick Replies
  quickRepliesContainer: {
    marginBottom: Spacing.md,
    marginLeft: 44,
  },
  quickRepliesScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  quickReplyChip: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    ...Shadows.sm,
  },

  // Typing Indicator
  typingRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typingAvatarContainer: {
    width: 36,
    height: 36,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingBubble: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    height: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardLight,
    borderTopWidth: 1,
    borderTopColor: Colors.overlayLight,
    gap: Spacing.sm,
  },
  dynamicQuickRepliesContainer: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
  },
  dynamicQuickRepliesScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dynamicQuickReplyChip: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : 0,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.overlayLight,
  },
  input: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 0 : Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.accent,
    ...Shadows.sm,
  },
  sendButtonInactive: {
    backgroundColor: Colors.overlayLight,
  },
});
