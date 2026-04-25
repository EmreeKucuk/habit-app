/**
 * Chat Tab — Mascot Chat Interface (Placeholder for Phase 5)
 */

import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing } from '@/constants/theme';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.mascotSmall}>
            <Typography variant="h3">🌿</Typography>
          </View>
          <View>
            <Typography variant="h3">Buddy</Typography>
            <Typography variant="caption" color={Colors.textMuted}>
              Your habit companion
            </Typography>
          </View>
        </View>

        {/* Chat area placeholder */}
        <View style={styles.chatArea}>
          <View style={styles.mascotBubble}>
            <Typography variant="body" color={Colors.white}>
              Hey there! I'll be your habit-tracking buddy. 🌱
            </Typography>
          </View>
          <Typography variant="bodySmall" color={Colors.textMuted} align="center" style={styles.placeholder}>
            💬 Full chat interface coming in Phase 5
          </Typography>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlayLight,
    gap: Spacing.md,
  },
  mascotSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  mascotBubble: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: Spacing.md,
    maxWidth: '80%',
    marginBottom: Spacing.lg,
  },
  placeholder: {
    marginTop: Spacing.xxl,
  },
});
