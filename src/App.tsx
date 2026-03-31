import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Image as ImageIcon, Loader2, Download, RefreshCw } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const COLORS = [
  { id: 'blue', name: '蓝色 (Blue)', hex: '#00438a' },
  { id: 'red', name: '红色 (Red)', hex: '#d9001b' },
  { id: 'white', name: '白色 (White)', hex: '#ffffff', border: true },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [bgColor, setBgColor] = useState<string>('blue');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setMimeType(file.type);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateIDPhoto = async () => {
    if (!selectedImage) return;
    
    setIsGenerating(true);
    try {
      const base64Data = selectedImage.split(',')[1];
      
      const prompt = `Convert this photo into a standard professional ID photo. Remove the original background and replace it with a solid ${bgColor} background. The person should be centered, facing forward, with shoulders visible. Ensure the lighting is even and professional. Do not change the person's facial features.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      let newImageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          newImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (newImageUrl) {
        setGeneratedImage(newImageUrl);
      } else {
        alert('Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('An error occurred while generating the image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = 'id-photo.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 证件照生成器</h1>
          <p className="text-gray-500">上传您的照片，一键生成专业证件照</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Left Column: Upload & Settings */}
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    1. 上传照片 (Upload Photo)
                  </label>
                  <div 
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${selectedImage ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-2 text-center">
                      {selectedImage ? (
                        <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden">
                          <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <RefreshCw className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 justify-center">
                            <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              点击上传
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">支持 PNG, JPG, JPEG</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    2. 选择背景色 (Select Background)
                  </label>
                  <div className="flex space-x-6">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setBgColor(color.id)}
                        className={`flex flex-col items-center space-y-2 focus:outline-none`}
                      >
                        <div 
                          className={`w-14 h-14 rounded-full shadow-sm flex items-center justify-center transition-transform ${bgColor === color.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'} ${color.border ? 'border border-gray-200' : ''}`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {bgColor === color.id && (
                            <div className={`w-4 h-4 rounded-full ${color.id === 'white' ? 'bg-blue-500' : 'bg-white'}`} />
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateIDPhoto}
                  disabled={!selectedImage || isGenerating}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                    !selectedImage || isGenerating 
                      ? 'bg-blue-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      生成中 (Generating...)
                    </>
                  ) : (
                    '生成证件照 (Generate)'
                  )}
                </button>
              </div>

              {/* Right Column: Result */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  生成结果 (Result)
                </label>
                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-6 min-h-[400px]">
                  {generatedImage ? (
                    <div className="space-y-6 w-full flex flex-col items-center">
                      <div className="relative rounded-lg overflow-hidden shadow-md max-w-[240px] w-full aspect-[3/4]">
                        <img src={generatedImage} alt="Generated ID Photo" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={handleDownload}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full max-w-[240px]"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载照片 (Download)
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="text-sm text-gray-500">生成后的照片将显示在这里</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
