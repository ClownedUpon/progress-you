// Entry file for building the Tiptap UMD vendor bundle.
// Re-exports everything under a single `window.Tiptap` namespace.

// Core
export { Editor, Extension, Node, Mark, mergeAttributes, InputRule, wrappingInputRule, textblockTypeInputRule } from '@tiptap/core';

// React bindings
export { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

// Base extensions (named exports)
export { Document } from '@tiptap/extension-document';
export { Paragraph } from '@tiptap/extension-paragraph';
export { Text } from '@tiptap/extension-text';
export { Bold } from '@tiptap/extension-bold';
export { Italic } from '@tiptap/extension-italic';
export { Underline } from '@tiptap/extension-underline';
export { Heading } from '@tiptap/extension-heading';
export { BulletList } from '@tiptap/extension-bullet-list';
export { OrderedList } from '@tiptap/extension-ordered-list';
export { ListItem } from '@tiptap/extension-list-item';
export { HardBreak } from '@tiptap/extension-hard-break';
export { History } from '@tiptap/extension-history';
export { Dropcursor } from '@tiptap/extension-dropcursor';
export { Gapcursor } from '@tiptap/extension-gapcursor';
export { Image } from '@tiptap/extension-image';
export { Placeholder } from '@tiptap/extension-placeholder';

// TextStyle kit (exports TextStyle, Color, FontFamily as named)
export { TextStyle, Color, FontFamily } from '@tiptap/extension-text-style';

// Suggestion (for slash commands)
export { Suggestion } from '@tiptap/suggestion';

// --- NEW extensions ---
export { Table } from '@tiptap/extension-table';
export { TableRow } from '@tiptap/extension-table-row';
export { TableCell } from '@tiptap/extension-table-cell';
export { TableHeader } from '@tiptap/extension-table-header';
export { TaskList } from '@tiptap/extension-task-list';
export { TaskItem } from '@tiptap/extension-task-item';
export { CodeBlock } from '@tiptap/extension-code-block';
export { HorizontalRule } from '@tiptap/extension-horizontal-rule';
export { Subscript } from '@tiptap/extension-subscript';
export { Superscript } from '@tiptap/extension-superscript';
export { Highlight } from '@tiptap/extension-highlight';
export { TextAlign } from '@tiptap/extension-text-align';
export { CharacterCount } from '@tiptap/extension-character-count';
