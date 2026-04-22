import { useState, useRef } from 'react';
import * as xlsx from 'xlsx';
import { Upload, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const SpreadsheetView = () => {
  const [data, setData] = useState<any[][]>([]);
  const [cols, setCols] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between bg-card border border-border p-4 rounded-t-xl">
        <div className="flex items-center gap-3 text-primary">
          <FileSpreadsheet size={24} />
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Data Analysis Studio</h2>
            <p className="text-xs text-neutral-400">Import .xlsx or .csv files to analyze locally</p>
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
            className="flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Upload size={16} /> Import Excel
          </button>
          <button
            onClick={exportFile}
            disabled={data.length === 0}
            className="flex items-center gap-2 bg-neutral-800 text-white hover:bg-neutral-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#13131a] border border-t-0 border-border rounded-b-xl relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/80 z-10 backdrop-blur-sm">
            <RefreshCw className="animate-spin text-primary" size={32} />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
            <FileSpreadsheet size={48} className="mb-4 opacity-20" />
            <p>Upload a spreadsheet to begin analysis</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border border-collapse">
            <thead className="bg-[#1a1a24] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 border-r border-b border-border w-12 text-center text-neutral-500 font-normal"></th>
                {cols.map((col) => (
                  <th key={col.key} className="px-4 py-2 border-r border-b border-border text-center font-bold text-neutral-300 min-w-[120px]">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-[#0a0a0f]">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-[#13131a] transition-colors">
                  <td className="px-2 py-1 border-r border-border text-center text-neutral-500 bg-[#1a1a24] font-medium sticky left-0">
                    {rowIndex + 1}
                  </td>
                  {cols.map((_, colIndex) => (
                    <td key={colIndex} className="p-0 border-r border-border relative group">
                      <input
                        type="text"
                        value={row[colIndex] || ''}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="w-full h-full bg-transparent px-3 py-2 text-sm text-neutral-300 outline-none focus:bg-primary/10 focus:ring-1 focus:ring-inset focus:ring-primary transition-colors"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {/* Add empty rows for better UX */}
              {Array.from({ length: Math.max(0, 50 - data.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="px-2 py-1 border-r border-border text-center text-neutral-500 bg-[#1a1a24] font-medium sticky left-0">
                    {data.length + i + 1}
                  </td>
                  {cols.map((_, colIndex) => (
                    <td key={colIndex} className="p-0 border-r border-border relative group">
                      <input
                        type="text"
                        className="w-full h-full bg-transparent px-3 py-2 text-sm text-neutral-300 outline-none focus:bg-primary/10 focus:ring-1 focus:ring-inset focus:ring-primary transition-colors"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};
