import { useState, useRef } from 'react';
import * as xlsx from 'xlsx';
import { Upload, FileSpreadsheet, Download, RefreshCw, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { motion } from 'framer-motion';

export const SpreadsheetView = () => {
  const [data, setData] = useState<any[][]>([]);
  const [cols, setCols] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCell, setActiveCell] = useState<{r: number, c: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = xlsx.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (rawData.length > 0) {
        setCols(rawData[0].map((_, i) => ({ key: String(i), name: String.fromCharCode(65 + i) })));
        setData(rawData);
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    if (!newData[rowIndex]) newData[rowIndex] = [];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const exportFile = () => {
    const ws = xlsx.utils.aoa_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    xlsx.writeFile(wb, "QuantTrd_Analysis.xlsx");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col h-[calc(100vh-100px)] border border-border rounded-xl overflow-hidden shadow-sm bg-card">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card-hover p-4 border-b border-border gap-4">
        <div className="flex items-center gap-3 text-primary">
          <FileSpreadsheet size={24} />
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">Data Studio</h2>
            <p className="text-xs text-muted-foreground">Professional Financial Modeling</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Upload size={16} /> Import File
          </button>
          <button
            onClick={exportFile}
            disabled={data.length === 0}
            className="flex items-center justify-center gap-2 bg-neutral-800 text-white dark:text-foreground hover:bg-neutral-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors text-sm"
          >
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Mock for Visual Professionalism) */}
      <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-background border-b border-border overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <button className="p-1.5 hover:bg-card-hover rounded text-muted-foreground hover:text-foreground transition-colors"><Bold size={16} /></button>
          <button className="p-1.5 hover:bg-card-hover rounded text-muted-foreground hover:text-foreground transition-colors"><Italic size={16} /></button>
          <button className="p-1.5 hover:bg-card-hover rounded text-muted-foreground hover:text-foreground transition-colors"><Type size={16} /></button>
        </div>
        <div className="flex items-center gap-1 px-2 border-r border-border">
          <button className="p-1.5 hover:bg-card-hover rounded text-muted-foreground hover:text-foreground transition-colors"><AlignLeft size={16} /></button>
          <button className="p-1.5 hover:bg-card-hover rounded text-muted-foreground hover:text-foreground transition-colors"><AlignCenter size={16} /></button>
          <button className="p-1.5 hover:bg-card-hover rounded text-muted-foreground hover:text-foreground transition-colors"><AlignRight size={16} /></button>
        </div>
        <div className="flex-1 px-2 min-w-[200px]">
          <div className="flex items-center bg-card border border-border rounded overflow-hidden">
            <div className="bg-card-hover px-3 py-1 font-mono text-xs border-r border-border text-muted-foreground min-w-[40px] text-center">
              {activeCell ? `${String.fromCharCode(65 + activeCell.c)}${activeCell.r + 1}` : 'ƒx'}
            </div>
            <input 
              type="text" 
              className="w-full bg-transparent px-3 py-1 text-sm outline-none text-foreground font-mono" 
              value={activeCell && data[activeCell.r] ? data[activeCell.r][activeCell.c] || '' : ''}
              onChange={(e) => activeCell && handleCellChange(activeCell.r, activeCell.c, e.target.value)}
              placeholder="Select a cell to edit or enter formula..."
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-background relative" id="spreadsheet-container">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 backdrop-blur-sm">
            <RefreshCw className="animate-spin text-primary" size={32} />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileSpreadsheet size={64} className="mb-4 opacity-10" />
            <p className="text-lg font-medium">No Data Loaded</p>
            <p className="text-sm">Upload an .xlsx or .csv file to begin quantitative analysis.</p>
          </div>
        ) : (
          <table className="min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-card-hover sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="w-12 h-8 border-r border-b border-border bg-card-hover sticky left-0 z-20"></th>
                {cols.map((col, index) => (
                  <th key={col.key} className={`h-8 px-4 border-r border-b border-border text-center font-semibold text-xs text-muted-foreground min-w-[120px] select-none ${activeCell?.c === index ? 'bg-primary/20 text-primary border-b-primary' : ''}`}>
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-card-hover transition-colors">
                  <td className={`w-12 border-r border-b border-border text-center text-xs text-muted-foreground bg-card-hover font-medium sticky left-0 z-10 select-none ${activeCell?.r === rowIndex ? 'bg-primary/20 text-primary border-r-primary' : ''}`}>
                    {rowIndex + 1}
                  </td>
                  {cols.map((_, colIndex) => {
                    const isSelected = activeCell?.r === rowIndex && activeCell?.c === colIndex;
                    return (
                      <td key={colIndex} 
                          onClick={() => setActiveCell({r: rowIndex, c: colIndex})}
                          className={`p-0 border-r border-b border-border relative ${isSelected ? 'outline outline-2 outline-primary z-10 bg-primary/5' : ''}`}
                      >
                        <input
                          type="text"
                          value={row[colIndex] || ''}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onFocus={() => setActiveCell({r: rowIndex, c: colIndex})}
                          className="w-full h-full bg-transparent px-3 py-1.5 text-sm text-foreground outline-none transition-colors"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Empty padding rows for professional look */}
              {Array.from({ length: Math.max(0, 30 - data.length) }).map((_, i) => {
                const rowIndex = data.length + i;
                return (
                  <tr key={`empty-${i}`}>
                    <td className={`w-12 border-r border-b border-border text-center text-xs text-muted-foreground bg-card-hover font-medium sticky left-0 z-10 select-none ${activeCell?.r === rowIndex ? 'bg-primary/20 text-primary border-r-primary' : ''}`}>
                      {rowIndex + 1}
                    </td>
                    {cols.map((_, colIndex) => {
                      const isSelected = activeCell?.r === rowIndex && activeCell?.c === colIndex;
                      return (
                        <td key={colIndex} 
                            onClick={() => setActiveCell({r: rowIndex, c: colIndex})}
                            className={`p-0 border-r border-b border-border relative ${isSelected ? 'outline outline-2 outline-primary z-10 bg-primary/5' : ''}`}
                        >
                          <input
                            type="text"
                            value=""
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            onFocus={() => setActiveCell({r: rowIndex, c: colIndex})}
                            className="w-full h-full bg-transparent px-3 py-1.5 text-sm text-foreground outline-none transition-colors"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};
