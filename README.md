# Habit Tracker App

A clean, minimal, and modern web application for tracking daily habits and building healthy routines.

## Features

### 🏠 Dashboard

- View all your habits in an organized card layout
- Track daily progress with visual progress bars
- Complete habits with a single click
- View current streaks and achievements
- Quick access to add new habits or browse templates

### ➕ Add New Habit

- Simple form to create custom habits
- Categories: Health, Sport, Learning, Productivity, Mindfulness, Social
- Frequency options: Daily, Weekly, Weekdays, Weekends
- Optional notes for motivation and context

### 📋 Habit Templates

- Pre-defined habit templates organized by category
- Quick-add functionality for popular habits
- Categories include:
  - **Health**: Drink 2L Water, 10,000 Steps, 8 Hours Sleep
  - **Sport**: Run 3x/Week, 20 Push-ups, Daily Yoga
  - **Learning**: Read 20 Minutes, Learn New Word, Practice Language

## Design Features

- **Modern UI**: Clean card-based layout with soft shadows and rounded corners
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Smooth Animations**: Subtle transitions and hover effects
- **Accessibility**: Keyboard navigation and screen reader friendly
- **Minimal Color Palette**: Professional blue and green accents on neutral backgrounds

## Getting Started

1. Open `index.html` in your web browser
2. Start by adding your first habit or choosing from templates
3. Track your progress daily by clicking "Complete Today"
4. Build streaks and maintain consistency!

## Technical Details

- **Pure HTML, CSS, and JavaScript** - No frameworks required
- **Local Storage** - All data persists in your browser
- **Progressive Enhancement** - Works without JavaScript for basic functionality
- **Mobile-First** - Responsive design optimized for all devices

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## File Structure

```
habit-app/
├── index.html          # Main application structure
├── styles.css          # Modern CSS with CSS variables for theming
├── script.js           # Application logic and interactivity
├── README.md           # This file
└── LICENSE            # License information
```

## Features in Detail

### Habit Management

- Create unlimited custom habits
- Delete habits with confirmation
- Complete/uncomplete habits for any day
- Automatic streak calculation
- Progress tracking with visual indicators

### Data Persistence

- All data stored locally in browser
- No account required
- Data persists between sessions
- Export/import functionality (available in code for future enhancement)

### User Experience

- Intuitive navigation between pages
- Keyboard shortcuts (Ctrl/Cmd + 1/2/3 for page navigation)
- Toast notifications for user feedback
- Smooth page transitions
- Empty state guidance for new users

## Customization

The app uses CSS custom properties (variables) for easy theming. You can modify colors, spacing, and other design tokens in the `:root` section of `styles.css`.

## Future Enhancements

Potential features for future versions:

- Weekly/monthly habit analytics
- Habit categories customization
- Data export/import functionality
- Habit sharing with friends
- Reminder notifications
- Progressive Web App (PWA) capabilities

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

This project is open source and available under the [MIT License](LICENSE).
