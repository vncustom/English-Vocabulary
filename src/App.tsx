import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Trophy, Play, RefreshCw, Home, CheckCircle2, XCircle, Heart, Image as ImageIcon, Type, Shuffle, Eraser, Volume2, VolumeX, Upload, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Nguồn âm thanh ổn định (Direct link)
const SOUND_URLS = {
  CORRECT: 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3', // Ting
  WRONG: 'https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3',   // Buzzer
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'  // Click
};

const DEFAULT_VOCABULARY_DATA = [
  { word: 'Sad', vietnamese: 'Buồn', icon: '😢' },
  { word: 'Happy', vietnamese: 'Vui vẻ', icon: '😊' },
  { word: 'Hungry', vietnamese: 'Đói', icon: '😋' },
  { word: 'Thirsty', vietnamese: 'Khát', icon: '🥤' },
  { word: 'Hot', vietnamese: 'Nóng', icon: '🔥' },
  { word: 'Cold', vietnamese: 'Lạnh', icon: '❄️' },
  { word: 'Rain', vietnamese: 'Mưa', icon: '🌧️' },
  { word: 'Chicken', vietnamese: 'Con gà', icon: '🐔' },
  { word: 'Milk', vietnamese: 'Sữa', icon: '🥛' },
  { word: 'Water', vietnamese: 'Nước', icon: '💧' },
  { word: 'Bread', vietnamese: 'Bánh mì', icon: '🍞' },
  { word: 'Fruit', vietnamese: 'Trái cây', icon: '🍎' },
  { word: 'Cake', vietnamese: 'Bánh ngọt', icon: '🍰' },
  { word: 'Sister', vietnamese: 'Chị/Em gái', icon: '👧' },
  { word: 'Brother', vietnamese: 'Anh/Em trai', icon: '👦' },
  { word: 'Grandpa', vietnamese: 'Ông', icon: '👴' },
  { word: 'Grandma', vietnamese: 'Bà', icon: '👵' },
  { word: 'Baby', vietnamese: 'Em bé', icon: '👶' },
  { word: 'Mom', vietnamese: 'Mẹ', icon: '👩' },
  { word: 'Dad', vietnamese: 'Bố', icon: '👨' },
  { word: 'Tea', vietnamese: 'Trà', icon: '🍵' },
  { word: 'Umbrella', vietnamese: 'Cái ô', icon: '🌂' },
  { word: 'Van', vietnamese: 'Xe tải nhỏ', icon: '🚐' },
  { word: 'Sun', vietnamese: 'Mặt trời', icon: '☀️' },
  { word: 'Head', vietnamese: 'Cái đầu', icon: '👤' },
  { word: 'Hand', vietnamese: 'Bàn tay', icon: '✋' },
  { word: 'Ear', vietnamese: 'Cái tai', icon: '👂' },
  { word: 'Nose', vietnamese: 'Cái mũi', icon: '👃' },
  { word: 'Leg', vietnamese: 'Cái chân', icon: '🦵' },
  { word: 'Arm', vietnamese: 'Cánh tay', icon: '💪' },
  { word: 'Mouth', vietnamese: 'Cái miệng', icon: '👄' },
  { word: 'Eye', vietnamese: 'Mắt', icon: '👁️' },
  { word: 'Orange', vietnamese: 'Màu cam', icon: '🟠' },
  { word: 'Black', vietnamese: 'Màu đen', icon: '⚫' },
  { word: 'White', vietnamese: 'Màu trắng', icon: '⚪' },
  { word: 'Yellow', vietnamese: 'Màu vàng', icon: '🟡' },
  { word: 'Green', vietnamese: 'Màu xanh lá', icon: '🟢' },
  { word: 'Blue', vietnamese: 'Màu xanh dương', icon: '🔵' },
  { word: 'Red', vietnamese: 'Màu đỏ', icon: '🔴' },
  { word: 'Pink', vietnamese: 'Màu hồng', icon: '🌸' },
  { word: 'Shirt', vietnamese: 'Áo sơ mi', icon: '👕' },
  { word: 'Shoes', vietnamese: 'Giày', icon: '👟' },
  { word: 'Skirt', vietnamese: 'Váy ngắn', icon: '👗' },
  { word: 'Shorts', vietnamese: 'Quần soóc', icon: '🩳' },
  { word: 'Dress', vietnamese: 'Váy liền', icon: '💃' },
  { word: 'Pants', vietnamese: 'Quần dài', icon: '👖' },
  { word: 'Socks', vietnamese: 'Tất', icon: '🧦' },
  { word: 'Hat', vietnamese: 'Cái mũ', icon: '👒' },
  { word: 'Run', vietnamese: 'Chạy', icon: '🏃' },
  { word: 'Swim', vietnamese: 'Bơi', icon: '🏊' },
  { word: 'Paint', vietnamese: 'Vẽ', icon: '🎨' },
  { word: 'Climb', vietnamese: 'Leo trèo', icon: '🧗' },
  { word: 'Five', vietnamese: 'Số 5', icon: '5️⃣' },
  { word: 'Three', vietnamese: 'Số 3', icon: '3️⃣' },
];

const App = () => {
  const [gameState, setGameState] = useState('HOME'); 
  const [gameMode, setGameMode] = useState('VISUAL');
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [userLetters, setUserLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);

  // New state for dynamic vocabulary
  const [vocabularyData, setVocabularyData] = useState(DEFAULT_VOCABULARY_DATA);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Hàm phát âm thanh cải tiến - tạo object mới trong luồng xử lý click để vượt qua rào cản Autoplay
  const playSfx = useCallback((type) => {
    if (isMuted) return;
    try {
      const audio = new Audio(SOUND_URLS[type.toUpperCase()]);
      audio.volume = 0.6;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Phát âm thanh bị trình duyệt chặn:", error);
        });
      }
    } catch (e) {
      console.error("Lỗi âm thanh:", e);
    }
  }, [isMuted]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    playSfx('click');
    
    try {
      const text = await file.text();
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        You are a vocabulary generator for a kids' English learning app.
        Based on the following text input, extract a list of English words.
        For each word, provide:
        1. The English word (Capitalized).
        2. The Vietnamese meaning.
        3. A single relevant emoji icon.

        Input text:
        "${text}"

        Return a JSON array of objects with keys: "word", "vietnamese", "icon".
        Example: [{"word": "Cat", "vietnamese": "Con mèo", "icon": "🐱"}]
        Ensure the JSON is valid. If the input is just a list of words, use them. If it's a story, extract key vocabulary.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const newData = JSON.parse(response.text);
      
      if (Array.isArray(newData) && newData.length > 0) {
        setVocabularyData(newData);
        alert(`Đã cập nhật ${newData.length} từ vựng mới!`);
      } else {
        alert("Không tìm thấy từ vựng hợp lệ trong file.");
      }
    } catch (error) {
      console.error("Error processing vocabulary:", error);
      alert("Có lỗi xảy ra khi xử lý file: " + error.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateQuestions = (mode, count) => {
    const shuffled = [...vocabularyData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, vocabularyData.length));
    
    return selected.map((item) => {
      const options = generateOptions(item, vocabularyData);
      
      if (mode === 'VISUAL') {
        return {
          type: 'VISUAL',
          correctAnswer: item.word,
          icon: item.icon,
          options,
          prompt: "Bé chọn từ đúng cho hình nhé!"
        };
      } else if (mode === 'MISSING_LETTER') {
        const wordArr = item.word.split('');
        const missingIdx = Math.floor(Math.random() * wordArr.length);
        const missingChar = wordArr[missingIdx].toLowerCase();
        const displayWord = [...wordArr];
        displayWord[missingIdx] = '_';
        
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const charOptions = [missingChar];
        while (charOptions.length < 4) {
          const randChar = alphabet[Math.floor(Math.random() * alphabet.length)];
          if (!charOptions.includes(randChar)) charOptions.push(randChar);
        }

        return {
          type: 'MISSING_LETTER',
          correctAnswer: missingChar,
          fullWord: item.word,
          displayWord: displayWord.join(''),
          vietnamese: item.vietnamese,
          options: charOptions.sort(() => 0.5 - Math.random()),
          prompt: `Điền chữ còn thiếu: "${item.vietnamese}"`
        };
      } else {
        const letters = item.word.split('').map((char, index) => ({ char, id: index }));
        const scrambled = [...letters].sort(() => 0.5 - Math.random());
        return {
          type: 'SCRAMBLE',
          correctAnswer: item.word,
          vietnamese: item.vietnamese,
          icon: item.icon,
          scrambledLetters: scrambled,
          prompt: `Ghép chữ có nghĩa: "${item.vietnamese}"`
        };
      }
    });
  };

  const generateOptions = (correctItem, allData) => {
    const opts = [correctItem.word];
    // If we don't have enough words, just duplicate (edge case for small custom lists)
    const pool = allData.length >= 4 ? allData : [...allData, ...DEFAULT_VOCABULARY_DATA];
    
    let attempts = 0;
    while (opts.length < 4 && attempts < 50) {
      const rand = pool[Math.floor(Math.random() * pool.length)].word;
      if (!opts.includes(rand)) opts.push(rand);
      attempts++;
    }
    return opts.sort(() => 0.5 - Math.random());
  };

  const startQuiz = () => {
    // Kích hoạt âm thanh ngay tại đây để 'mở khóa' cho trình duyệt
    playSfx('click');
    
    const newQuestions = generateQuestions(gameMode, questionCount);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setGameState('QUIZ');
    setFeedback(null);
    
    if (gameMode === 'SCRAMBLE') {
      setUserLetters([]);
      setAvailableLetters(newQuestions[0].scrambledLetters);
    }
  };

  useEffect(() => {
    if (gameState === 'QUIZ' && questions[currentIndex] && questions[currentIndex].type === 'SCRAMBLE') {
      setUserLetters([]);
      setAvailableLetters(questions[currentIndex].scrambledLetters);
    }
  }, [currentIndex, gameState, questions]);

  const handleAnswer = (answer) => {
    if (feedback) return;
    const isCorrect = answer.toLowerCase() === questions[currentIndex].correctAnswer.toLowerCase();
    
    if (isCorrect) {
      setScore(s => s + 1);
      playSfx('correct');
    } else {
      playSfx('wrong');
    }
    
    setFeedback({ isCorrect, answer });

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFeedback(null);
      } else {
        setGameState('RESULT');
      }
    }, 1200);
  };

  const selectLetter = (letterObj) => {
    if (feedback) return;
    playSfx('click');
    const newUserLetters = [...userLetters, letterObj];
    setUserLetters(newUserLetters);
    setAvailableLetters(availableLetters.filter(l => l.id !== letterObj.id));

    if (newUserLetters.length === questions[currentIndex].correctAnswer.length) {
      const builtWord = newUserLetters.map(l => l.char).join('');
      handleAnswer(builtWord);
    }
  };

  const removeLetter = (letterObj) => {
    if (feedback) return;
    playSfx('click');
    setUserLetters(userLetters.filter(l => l.id !== letterObj.id));
    setAvailableLetters([...availableLetters, letterObj]);
  };

  const clearAssembly = () => {
    if (feedback) return;
    playSfx('click');
    setUserLetters([]);
    setAvailableLetters(questions[currentIndex].scrambledLetters);
  }

  const getRank = () => {
    const percent = (score / questionCount) * 100;
    if (percent === 100) return { title: "Siêu Nhân Từ Vựng", msg: "Bé thật xuất sắc! 100 điểm!", icon: "👑" };
    if (percent >= 80) return { title: "Vua Tiếng Anh", msg: "Bé giỏi lắm, làm rất tốt!", icon: "🦁" };
    if (percent >= 50) return { title: "Nhà Thông Thái Nhí", msg: "Bé làm tốt lắm, cố gắng thêm nhé!", icon: "🦉" };
    return { title: "Bạn Nhỏ Cố Gắng", msg: "Bé hãy ôn tập thêm nhé!", icon: "🌱" };
  };

  const SoundToggle = () => (
    <button 
      onClick={() => {
        setIsMuted(!isMuted);
        if (isMuted) playSfx('click');
      }} 
      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg text-blue-500 transition-all z-50 border-2 border-white active:scale-90"
    >
      {isMuted ? <VolumeX className="w-6 h-6 text-gray-400" /> : <Volume2 className="w-6 h-6 animate-pulse" />}
    </button>
  );

  if (gameState === 'HOME') {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <SoundToggle />
        
        <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-200 rounded-full -translate-x-16 -translate-y-16 opacity-50" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-200 rounded-full translate-x-24 translate-y-24 opacity-50" />

        <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-xl w-full text-center border-b-[12px] border-orange-200 relative z-10">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-5 rounded-full ring-8 ring-orange-50 animate-bounce">
              <Sparkles className="text-orange-500 w-12 h-12" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-blue-600 mb-6 drop-shadow-sm tracking-tight">VUI HỌC TIẾNG ANH</h1>

          {/* File Upload Section */}
          <div className="mb-6 flex justify-center">
            <input 
              type="file" 
              accept=".txt" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Đổi từ vựng
                </>
              )}
            </button>
          </div>

          <div className="mb-8">
            <p className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-widest text-center">1. Chọn trò chơi bé thích:</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => { setGameMode('VISUAL'); playSfx('click'); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-3xl border-4 transition-all ${gameMode === 'VISUAL' ? 'border-blue-500 bg-blue-50 scale-105 shadow-md' : 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-100'}`}
              >
                <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-inner text-2xl">🖼️</div>
                <span className="font-black text-blue-600 text-[11px] uppercase">Nhìn hình</span>
              </button>
              
              <button
                onClick={() => { setGameMode('MISSING_LETTER'); playSfx('click'); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-3xl border-4 transition-all ${gameMode === 'MISSING_LETTER' ? 'border-pink-500 bg-pink-50 scale-105 shadow-md' : 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-100'}`}
              >
                <div className="bg-pink-500 text-white p-3 rounded-2xl shadow-inner text-2xl">✍️</div>
                <span className="font-black text-pink-600 text-[11px] uppercase">Điền chữ</span>
              </button>

              <button
                onClick={() => { setGameMode('SCRAMBLE'); playSfx('click'); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-3xl border-4 transition-all ${gameMode === 'SCRAMBLE' ? 'border-purple-500 bg-purple-50 scale-105 shadow-md' : 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-100'}`}
              >
                <div className="bg-purple-500 text-white p-3 rounded-2xl shadow-inner text-2xl">🔀</div>
                <span className="font-black text-purple-600 text-[11px] uppercase">Tráo chữ</span>
              </button>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-widest text-center">2. Chọn số câu hỏi:</p>
            <div className="flex justify-center gap-4">
              {[20, 30, 40].map((num) => (
                <button
                  key={num}
                  onClick={() => { setQuestionCount(num); playSfx('click'); }}
                  className={`w-14 h-14 rounded-full border-4 font-black text-lg transition-all ${questionCount === num ? 'border-yellow-400 bg-yellow-400 text-white scale-110 shadow-md' : 'border-gray-200 text-gray-400'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-black py-5 rounded-[25px] shadow-[0_8px_0_rgb(34,197,94)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-4 group"
          >
            VÀO HỌC THÔI! <Play className="w-8 h-8 fill-current group-hover:scale-125 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULT') {
    const rank = getRank();
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 relative">
        <SoundToggle />
        <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-md w-full text-center border-b-[12px] border-blue-200">
          <div className="text-8xl mb-6 animate-bounce">{rank.icon}</div>
          <h2 className="text-4xl font-black text-orange-500 mb-2 uppercase tracking-tight">{rank.title}</h2>
          <div className="bg-blue-50 rounded-3xl p-8 my-8 border-4 border-blue-100">
            <div className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-widest">Điểm của bé</div>
            <div className="text-6xl font-black text-blue-600">{score}<span className="text-2xl text-blue-300">/{questionCount}</span></div>
          </div>
          <p className="text-gray-500 text-xl font-bold mb-10 italic px-4">"{rank.msg}"</p>
          <div className="flex flex-col gap-4">
            <button onClick={startQuiz} className="w-full bg-green-500 text-white py-5 rounded-3xl text-2xl font-black shadow-[0_6px_0_rgb(34,197,94)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6" /> CHƠI LẠI
            </button>
            <button onClick={() => { setGameState('HOME'); playSfx('click'); }} className="w-full bg-gray-100 text-gray-500 py-5 rounded-3xl text-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-3">
              <Home className="w-6 h-6" /> VỀ TRANG CHỦ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const modeColor = q.type === 'VISUAL' ? 'blue' : q.type === 'MISSING_LETTER' ? 'pink' : 'purple';

  return (
    <div className={`min-h-screen bg-${modeColor}-50 flex flex-col items-center p-4 transition-colors duration-500 relative`}>
      <SoundToggle />
      <div className="w-full max-w-xl flex items-center gap-4 mb-8">
        <button onClick={() => { setGameState('HOME'); playSfx('click'); }} className="p-3 bg-white rounded-2xl shadow-md text-gray-400 hover:text-red-500 transition-all active:scale-90">
          <Home className="w-7 h-7" />
        </button>
        <div className="flex-1 bg-white h-5 rounded-full p-1 shadow-inner border-2 border-white overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 bg-${modeColor}-400 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
            style={{ width: `${((currentIndex + 1) / questionCount) * 100}%` }}
          />
        </div>
        <div className="bg-white px-5 py-2 rounded-2xl shadow-md font-black text-lg text-gray-700">
          {currentIndex + 1}/{questionCount}
        </div>
      </div>

      <div className={`bg-white rounded-[50px] shadow-2xl p-8 max-w-xl w-full flex flex-col border-b-[16px] border-gray-100 relative overflow-hidden min-h-[520px] transition-transform ${feedback && !feedback.isCorrect ? 'animate-shake' : ''}`}>
        {feedback && (
          <div className={`absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[2px] animate-in fade-in duration-200 ${feedback.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="bg-white p-8 rounded-full shadow-2xl animate-in zoom-in duration-300 ring-8 ring-white/50">
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-24 h-24 text-green-500 animate-bounce" />
              ) : (
                <XCircle className="w-24 h-24 text-red-500" />
              )}
            </div>
          </div>
        )}

        <div className="text-center">
          <div className={`inline-block px-6 py-2 rounded-full font-black text-white text-xs uppercase tracking-widest mb-4 bg-${modeColor}-400 shadow-md`}>
            {q.type === 'VISUAL' ? 'NHÌN HÌNH CHỌN TỪ' : q.type === 'MISSING_LETTER' ? 'ĐIỀN CHỮ CÒN THIẾU' : 'SẮP XẾP LẠI CHỮ CÁI'}
          </div>
          <h2 className="text-xl font-bold text-gray-500 mb-6">{q.prompt}</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {q.type === 'VISUAL' ? (
            <div className="text-[140px] leading-none mb-8 select-none drop-shadow-lg animate-pulse">{q.icon}</div>
          ) : q.type === 'MISSING_LETTER' ? (
            <div className="text-center w-full">
              <div className={`text-7xl font-black text-${modeColor}-500 tracking-[0.2em] mb-8 bg-${modeColor}-50 py-10 rounded-[40px] border-2 border-${modeColor}-100 shadow-inner`}>{q.displayWord}</div>
              <div className="text-2xl text-orange-400 font-black bg-orange-50 px-8 py-2 rounded-2xl border-2 border-orange-100">{q.vietnamese}</div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-10">
              <div className="flex flex-wrap justify-center gap-3 min-h-[80px] w-full p-4 bg-purple-50 rounded-[30px] border-2 border-dashed border-purple-200">
                {userLetters.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => removeLetter(l)}
                    className="w-14 h-14 bg-white border-b-4 border-purple-400 text-purple-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {l.char}
                  </button>
                ))}
                {Array.from({ length: q.correctAnswer.length - userLetters.length }).map((_, i) => (
                  <div key={i} className="w-14 h-14 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200" />
                ))}
              </div>
              
              <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border-2 border-gray-50">
                 <div className="text-6xl">{q.icon}</div>
                 <div className="text-2xl text-orange-500 font-black uppercase tracking-wide">{q.vietnamese}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          {q.type !== 'SCRAMBLE' ? (
            <div className="grid grid-cols-2 gap-4">
              {q.options.map((opt, idx) => {
                let style = `bg-white border-gray-100 text-gray-600 shadow-[0_8px_0_rgb(243,244,246)] hover:bg-gray-50 active:translate-y-2 active:shadow-none hover:scale-[1.02]`;
                if (feedback) {
                  if (opt.toLowerCase() === q.correctAnswer.toLowerCase()) style = "bg-green-500 border-green-500 text-white shadow-[0_8px_0_rgb(22,163,74)] scale-105";
                  else if (opt === feedback.answer) style = "bg-red-500 border-red-500 text-white shadow-[0_8px_0_rgb(220,38,38)]";
                  else style = "opacity-30 grayscale scale-95 shadow-none";
                }
                return (
                  <button key={idx} disabled={!!feedback} onClick={() => handleAnswer(opt)} className={`py-6 rounded-[32px] border-4 text-3xl font-black transition-all ${style}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap justify-center gap-4">
                {availableLetters.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => selectLetter(l)}
                    className="w-16 h-16 bg-purple-500 border-b-8 border-purple-700 text-white rounded-[20px] flex items-center justify-center text-3xl font-black hover:scale-110 active:scale-95 transition-all shadow-lg"
                  >
                    {l.char}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={clearAssembly}
                  className="flex items-center gap-2 bg-gray-100 text-gray-400 px-6 py-3 rounded-full font-bold hover:bg-red-50 hover:text-red-400 transition-all active:scale-95 shadow-sm"
                >
                  <Eraser className="w-5 h-5" /> Xóa hết làm lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white/80 backdrop-blur px-8 py-3 rounded-[30px] shadow-lg border-4 border-white flex items-center gap-4 transition-all hover:scale-105">
        <div className="bg-yellow-400 p-2 rounded-full shadow-md">
          <Trophy className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-black text-gray-600">Điểm của bé: <span className={`text-${modeColor}-500 text-2xl`}>{score}</span></span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}} />
    </div>
  );
};

export default App;
