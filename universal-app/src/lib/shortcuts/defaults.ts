/**
 * Default Application Shortcuts
 * Pre-configured shortcuts for common application actions
 */

import type { ShortcutInput } from './types';

/** Navigation shortcuts */
export const NAVIGATION_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'nav.home',
    label: 'Go to Home',
    description: 'Navigate to the home dashboard',
    key: 'h',
    modifiers: ['meta', 'shift'],
    contexts: ['global'],
    handler: () => {
      window.location.href = '/';
    },
    group: 'navigation',
  },
  {
    id: 'nav.search',
    label: 'Open Search',
    description: 'Open the global search dialog',
    key: 'k',
    modifiers: ['meta'],
    contexts: ['global'],
    handler: () => {
      // Dispatch custom event for search
      window.dispatchEvent(new CustomEvent('shortcut:search'));
    },
    group: 'navigation',
    priority: 'high',
  },
  {
    id: 'nav.back',
    label: 'Go Back',
    description: 'Navigate to the previous page',
    key: '[',
    modifiers: ['meta'],
    contexts: ['global'],
    handler: () => {
      window.history.back();
    },
    group: 'navigation',
  },
  {
    id: 'nav.forward',
    label: 'Go Forward',
    description: 'Navigate to the next page',
    key: ']',
    modifiers: ['meta'],
    contexts: ['global'],
    handler: () => {
      window.history.forward();
    },
    group: 'navigation',
  },
];

/** Editor shortcuts */
export const EDITOR_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'editor.save',
    label: 'Save',
    description: 'Save the current document',
    key: 's',
    modifiers: ['meta'],
    contexts: ['editor'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:save'));
    },
    group: 'editor',
    priority: 'high',
  },
  {
    id: 'editor.undo',
    label: 'Undo',
    description: 'Undo the last action',
    key: 'z',
    modifiers: ['meta'],
    contexts: ['editor'],
    handler: () => {
      document.execCommand('undo');
    },
    group: 'editor',
  },
  {
    id: 'editor.redo',
    label: 'Redo',
    description: 'Redo the last undone action',
    key: 'z',
    modifiers: ['meta', 'shift'],
    contexts: ['editor'],
    handler: () => {
      document.execCommand('redo');
    },
    group: 'editor',
  },
  {
    id: 'editor.selectAll',
    label: 'Select All',
    description: 'Select all content',
    key: 'a',
    modifiers: ['meta'],
    contexts: ['editor'],
    handler: () => {
      document.execCommand('selectAll');
    },
    group: 'editor',
    preventDefault: false, // Allow default browser behavior
  },
];

/** Dialog shortcuts */
export const DIALOG_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'dialog.close',
    label: 'Close Dialog',
    description: 'Close the current dialog',
    key: 'Escape',
    modifiers: [],
    contexts: ['dialog'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:closeDialog'));
    },
    group: 'dialog',
    priority: 'high',
  },
  {
    id: 'dialog.confirm',
    label: 'Confirm',
    description: 'Confirm the dialog action',
    key: 'Enter',
    modifiers: ['meta'],
    contexts: ['dialog'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:confirmDialog'));
    },
    group: 'dialog',
  },
];

/** Recording shortcuts */
export const RECORDING_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'recording.new',
    label: 'New Recording',
    description: 'Start a new recording session',
    key: 'n',
    modifiers: ['meta'],
    contexts: ['global'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:newRecording'));
    },
    group: 'recording',
    priority: 'high',
  },
  {
    id: 'recording.toggle',
    label: 'Start/Stop Recording',
    description: 'Toggle audio recording',
    key: 'r',
    modifiers: ['meta', 'shift'],
    contexts: ['recording', 'global'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:toggleRecording'));
    },
    group: 'recording',
    priority: 'high',
  },
  {
    id: 'recording.pause',
    label: 'Pause Recording',
    description: 'Pause the current recording',
    key: 'p',
    modifiers: ['meta', 'shift'],
    contexts: ['recording'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:pauseRecording'));
    },
    group: 'recording',
  },
];

/** Transcription shortcuts */
export const TRANSCRIPTION_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'transcription.play',
    label: 'Play/Pause',
    description: 'Toggle audio playback',
    key: ' ',
    modifiers: [],
    contexts: ['transcription'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:togglePlayback'));
    },
    group: 'transcription',
    priority: 'high',
  },
  {
    id: 'transcription.seekBack',
    label: 'Seek Back 5s',
    description: 'Jump back 5 seconds in the audio',
    key: 'ArrowLeft',
    modifiers: [],
    contexts: ['transcription'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:seekBack', { detail: 5 }));
    },
    group: 'transcription',
  },
  {
    id: 'transcription.seekForward',
    label: 'Seek Forward 5s',
    description: 'Jump forward 5 seconds in the audio',
    key: 'ArrowRight',
    modifiers: [],
    contexts: ['transcription'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:seekForward', { detail: 5 }));
    },
    group: 'transcription',
  },
  {
    id: 'transcription.speedUp',
    label: 'Increase Speed',
    description: 'Increase playback speed',
    key: '>',
    modifiers: ['shift'],
    contexts: ['transcription'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:speedUp'));
    },
    group: 'transcription',
  },
  {
    id: 'transcription.slowDown',
    label: 'Decrease Speed',
    description: 'Decrease playback speed',
    key: '<',
    modifiers: ['shift'],
    contexts: ['transcription'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:slowDown'));
    },
    group: 'transcription',
  },
];

/** Review queue shortcuts */
export const REVIEW_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'review.approve',
    label: 'Approve',
    description: 'Approve the current item',
    key: 'a',
    modifiers: ['meta', 'shift'],
    contexts: ['review'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:approve'));
    },
    group: 'review',
  },
  {
    id: 'review.reject',
    label: 'Reject',
    description: 'Reject the current item',
    key: 'r',
    modifiers: ['meta', 'shift'],
    contexts: ['review'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:reject'));
    },
    group: 'review',
  },
  {
    id: 'review.next',
    label: 'Next Item',
    description: 'Go to the next review item',
    key: 'j',
    modifiers: [],
    contexts: ['review'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:nextItem'));
    },
    group: 'review',
  },
  {
    id: 'review.previous',
    label: 'Previous Item',
    description: 'Go to the previous review item',
    key: 'k',
    modifiers: [],
    contexts: ['review'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:previousItem'));
    },
    group: 'review',
  },
];

/** Help shortcuts */
export const HELP_SHORTCUTS: ShortcutInput[] = [
  {
    id: 'help.shortcuts',
    label: 'Show Shortcuts',
    description: 'Display keyboard shortcuts help',
    key: '/',
    modifiers: ['meta'],
    contexts: ['global'],
    handler: () => {
      window.dispatchEvent(new CustomEvent('shortcut:showHelp'));
    },
    group: 'help',
    priority: 'critical',
  },
  {
    id: 'help.documentation',
    label: 'Open Documentation',
    description: 'Open the documentation in a new tab',
    key: '?',
    modifiers: ['shift'],
    contexts: ['global'],
    handler: () => {
      window.open('/docs', '_blank');
    },
    group: 'help',
  },
];

/** All default shortcuts combined */
export const DEFAULT_SHORTCUTS: ShortcutInput[] = [
  ...NAVIGATION_SHORTCUTS,
  ...EDITOR_SHORTCUTS,
  ...DIALOG_SHORTCUTS,
  ...RECORDING_SHORTCUTS,
  ...TRANSCRIPTION_SHORTCUTS,
  ...REVIEW_SHORTCUTS,
  ...HELP_SHORTCUTS,
];

/** Default shortcut groups */
export const DEFAULT_GROUPS = [
  { id: 'navigation', label: 'Navigation', icon: '🧭', order: 0 },
  { id: 'editor', label: 'Editor', icon: '✏️', order: 1 },
  { id: 'dialog', label: 'Dialogs', icon: '💬', order: 2 },
  { id: 'recording', label: 'Recording', icon: '🎙️', order: 3 },
  { id: 'transcription', label: 'Transcription', icon: '📝', order: 4 },
  { id: 'review', label: 'Review', icon: '✅', order: 5 },
  { id: 'help', label: 'Help', icon: '❓', order: 6 },
];
