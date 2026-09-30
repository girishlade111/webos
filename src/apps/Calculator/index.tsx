import React, { useState, useEffect } from 'react';
import { History, Delete } from 'lucide-react';
import { sound } from '../../core/sound';

export const CalculatorApp: React.FC<{ windowId: string }> = () => {
  const [display, setDisplay] = useState<string>('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [isScientific, setIsScientific] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const inputDigit = (digit: string) => {
    sound.playClick();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    sound.playClick();
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    sound.playClick();
    setDisplay('0');
    setPrevVal(null);
    setOp(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    sound.playClick();
    const val = parseFloat(display);
    setDisplay(String(-val));
  };

  const inputPercent = () => {
    sound.playClick();
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };

  const performOp = (nextOp: string) => {
    sound.playClick();
    const inputValue = parseFloat(display);

    if (prevVal === null) {
      setPrevVal(inputValue);
    } else if (op) {
      const current = prevVal || 0;
      let newValue = current;
      if (op === '+') newValue = current + inputValue;
      else if (op === '-') newValue = current - inputValue;
      else if (op === '×') newValue = current * inputValue;
      else if (op === '÷') newValue = inputValue !== 0 ? current / inputValue : 0;
      else if (op === '^') newValue = Math.pow(current, inputValue);

      const record = `${current} ${op} ${inputValue} = ${newValue}`;
      setHistory((prev) => [record, ...prev]);
      setPrevVal(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOp(nextOp === '=' ? null : nextOp);
  };

  const performScientific = (type: string) => {
    sound.playClick();
    const val = parseFloat(display);
    let res = val;
    switch (type) {
      case 'sin': res = Math.sin(val); break;
      case 'cos': res = Math.cos(val); break;
      case 'tan': res = Math.tan(val); break;
      case 'sqrt': res = Math.sqrt(val); break;
      case 'ln': res = Math.log(val); break;
      case 'log': res = Math.log10(val); break;
      case 'sqr': res = val * val; break;
      case 'pi': res = Math.PI; break;
      case 'e': res = Math.E; break;
    }
    setHistory((prev) => [`${type}(${val}) = ${res}`, ...prev]);
    setDisplay(String(res));
    setWaitingForOperand(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.') inputDecimal();
      else if (e.key === '+' || e.key === '-') performOp(e.key);
      else if (e.key === '*') performOp('×');
      else if (e.key === '/') performOp('÷');
      else if (e.key === 'Enter' || e.key === '=') performOp('=');
      else if (e.key === 'Escape' || e.key === 'c') clearAll();
      else if (e.key === 'Backspace') {
        if (!waitingForOperand && display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="flex h-full w-full flex-col bg-neutral-900 text-white select-none">
      {/* Top Header Mode Toggle */}
      <div className="flex h-9 items-center justify-between px-3 border-b border-white/10 bg-neutral-800/80">
        <button
          onClick={() => setIsScientific(!isScientific)}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {isScientific ? 'Basic Mode' : 'Scientific Mode'}
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1 rounded text-neutral-400 hover:text-white transition-colors ${showHistory ? 'text-amber-400' : ''}`}
          title="History Tape"
        >
          <History size={14} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex flex-1 flex-col p-4 justify-between">
          {/* Display Output */}
          <div className="text-right py-4 px-2">
            <div className="text-xs text-neutral-400 h-4">
              {prevVal !== null && op ? `${prevVal} ${op}` : ''}
            </div>
            <div className="text-4xl font-light tracking-tight truncate tabular-nums text-white">
              {display}
            </div>
          </div>

          {/* Keypad Grid */}
          <div className={`grid gap-2 ${isScientific ? 'grid-cols-6' : 'grid-cols-4'}`}>
            {isScientific && (
              <>
                <button onClick={() => performScientific('sin')} className="btn-sci">sin</button>
                <button onClick={() => performScientific('cos')} className="btn-sci">cos</button>
                <button onClick={() => performScientific('tan')} className="btn-sci">tan</button>
                <button onClick={() => performScientific('sqrt')} className="btn-sci">√</button>
                <button onClick={() => performScientific('sqr')} className="btn-sci">x²</button>
                <button onClick={() => performOp('^')} className="btn-sci">xʸ</button>
                <button onClick={() => performScientific('pi')} className="btn-sci">π</button>
                <button onClick={() => performScientific('e')} className="btn-sci">e</button>
                <button onClick={() => performScientific('ln')} className="btn-sci">ln</button>
                <button onClick={() => performScientific('log')} className="btn-sci">log</button>
              </>
            )}

            <button onClick={clearAll} className="btn-func">AC</button>
            <button onClick={toggleSign} className="btn-func">±</button>
            <button onClick={inputPercent} className="btn-func">%</button>
            <button onClick={() => performOp('÷')} className="btn-op">÷</button>

            <button onClick={() => inputDigit('7')} className="btn-num">7</button>
            <button onClick={() => inputDigit('8')} className="btn-num">8</button>
            <button onClick={() => inputDigit('9')} className="btn-num">9</button>
            <button onClick={() => performOp('×')} className="btn-op">×</button>

            <button onClick={() => inputDigit('4')} className="btn-num">4</button>
            <button onClick={() => inputDigit('5')} className="btn-num">5</button>
            <button onClick={() => inputDigit('6')} className="btn-num">6</button>
            <button onClick={() => performOp('-')} className="btn-op">−</button>

            <button onClick={() => inputDigit('1')} className="btn-num">1</button>
            <button onClick={() => inputDigit('2')} className="btn-num">2</button>
            <button onClick={() => inputDigit('3')} className="btn-num">3</button>
            <button onClick={() => performOp('+')} className="btn-op">+</button>

            <button onClick={() => inputDigit('0')} className="btn-num col-span-2 text-left pl-6">0</button>
            <button onClick={inputDecimal} className="btn-num">.</button>
            <button onClick={() => performOp('=')} className="btn-op bg-orange-600 hover:bg-orange-500">=</button>
          </div>
        </div>

        {/* History Tape Drawer */}
        {showHistory && (
          <div className="w-56 border-l border-white/10 bg-neutral-950 p-3 flex flex-col justify-between animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-semibold text-neutral-400">
              <span>Calculation History</span>
              <button onClick={() => setHistory([])} className="hover:text-white" title="Clear history">
                <Delete size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs font-mono text-neutral-300">
              {history.length === 0 ? (
                <div className="text-neutral-500 text-center py-6">No calculations yet</div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-1">
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .btn-num {
          background-color: #3f3f46;
          color: white;
          font-size: 1.1rem;
          font-weight: 500;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }
        .btn-num:hover {
          background-color: #52525b;
        }
        .btn-func {
          background-color: #71717a;
          color: #18181b;
          font-size: 1rem;
          font-weight: 600;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }
        .btn-func:hover {
          background-color: #a1a1aa;
        }
        .btn-op {
          background-color: #f97316;
          color: white;
          font-size: 1.25rem;
          font-weight: 500;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }
        .btn-op:hover {
          background-color: #ea580c;
        }
        .btn-sci {
          background-color: #27272a;
          color: #a1a1aa;
          font-size: 0.75rem;
          font-weight: 500;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, color 0.15s;
        }
        .btn-sci:hover {
          background-color: #3f3f46;
          color: white;
        }
      `}</style>
    </div>
  );
};
