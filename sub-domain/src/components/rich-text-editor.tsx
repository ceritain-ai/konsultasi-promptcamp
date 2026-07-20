'use client';

import { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  isDark: boolean;
}

export function RichTextEditor({ value, onChange, isDark }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const toolbarBtnClass = `border px-2 py-1 text-xs font-bold ${
    isDark
      ? 'border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800'
      : 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200'
  }`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={() => execCommand('bold')} className={toolbarBtnClass}>B</button>
        <button type="button" onClick={() => execCommand('italic')} className={`${toolbarBtnClass} italic`}>I</button>
        <button type="button" onClick={() => execCommand('underline')} className={`${toolbarBtnClass} underline`}>U</button>
        <button type="button" onClick={() => execCommand('strikeThrough')} className={`${toolbarBtnClass} line-through`}>S</button>
        <div className={`flex items-center gap-1 border px-2 py-0.5 text-xs ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'
        }`}>
          <span>Color:</span>
          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            className="w-4 h-4 cursor-pointer bg-transparent border-0 p-0"
          />
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={`w-full min-h-[150px] border p-3 text-xs outline-none transition focus:border-emerald-500 overflow-y-auto scrollbar-thin ${
          isDark 
            ? 'border-slate-800 bg-slate-950 text-slate-100' 
            : 'border-slate-200 bg-white text-slate-950'
        }`}
      />
    </div>
  );
}
