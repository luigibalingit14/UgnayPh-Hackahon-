'use client';
import { scanImageWithGemini } from '@/lib/gemini-vision';
import { useState } from 'react';

export default function ImageScannerTestPage() {
  const [result, setResult] = useState('Wala pang result...');
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult('Nagsa-scan na ang AI... Sandali lang po.');
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Default instruction, pwede mo 'to ibahin depende sa anong gusto mong gawin ng AI
    const instruction = "I-summarize at i-extract lahat ng data sa image na to.";
    const apiResponse = await scanImageWithGemini(formData, instruction);
    
    if (apiResponse.error) {
      setResult('May Error: ' + apiResponse.error);
    } else {
      setResult(apiResponse.text || 'Done!');
    }
    
    setIsLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-8 pt-20">
      <h1 className="text-3xl font-bold mb-2">AI Image Scanner Test</h1>
      <p className="text-gray-500 mb-8">Gamit ang buong lakas ng Google Gemini 1.5 Flash Vision API.</p>
      
      <div className="p-6 border rounded-xl shadow-lg backdrop-blur-md bg-white/50 dark:bg-black/20">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mag-upload ng image (Resibo, ID, Plate num, etc):</label>
            <input 
              type="file" 
              name="image" 
              accept="image/*" 
              required 
              className="block w-full text-sm bg-white dark:bg-gray-800 border p-2 rounded-lg" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-semibold px-4 py-3 rounded-xl transition-colors ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Nag-iisip ang AI...' : 'I-scan ang Image!'}
          </button>
        </form>
      </div>

      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl min-h-[200px] shadow-inner border border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-lg mb-4 text-blue-600 dark:text-blue-400">Resulta mula sa AI:</h3>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {result}
        </div>
      </div>
    </div>
  );
}
