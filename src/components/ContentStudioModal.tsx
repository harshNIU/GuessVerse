import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Eye,
  UserCheck,
  Film,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  HelpCircle,
  Database,
} from 'lucide-react';

interface ContentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'eyes' | 'silhouettes' | 'frames' | 'dialogues' | 'guide';

export const ContentStudioModal: React.FC<ContentStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('eyes');
  const [stats, setStats] = useState<{
    counts?: { frames: number; dialogues: number; silhouettes: number; eyes: number; customTotal: number };
    custom?: any;
  }>({});
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formGender, setFormGender] = useState<'actor' | 'actress'>('actor');
  const [formFeature, setFormFeature] = useState('');
  const [formMovie, setFormMovie] = useState('');
  const [formYear, setFormYear] = useState('2023');
  const [formDialogue, setFormDialogue] = useState('');
  const [formClue, setFormClue] = useState('');

  // Image data states
  const [primaryImageBase64, setPrimaryImageBase64] = useState<string>('');
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string>('');
  const [primaryImageUrlInput, setPrimaryImageUrlInput] = useState<string>('');

  const [revealImageBase64, setRevealImageBase64] = useState<string>('');
  const [revealImagePreview, setRevealImagePreview] = useState<string>('');
  const [revealImageUrlInput, setRevealImageUrlInput] = useState<string>('');

  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const revealFileInputRef = useRef<HTMLInputElement>(null);

  // Load database content
  const loadDatabase = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load content database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDatabase();
      setUploadSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'primary' | 'reveal'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'primary') {
        setPrimaryImageBase64(result);
        setPrimaryImagePreview(result);
        setPrimaryImageUrlInput('');
      } else {
        setRevealImageBase64(result);
        setRevealImagePreview(result);
        setRevealImageUrlInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToServer = async (base64OrUrl: string, nameTag: string): Promise<string> => {
    if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
      return base64OrUrl;
    }
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64OrUrl,
        filename: nameTag,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload image file');
    }
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUploadSuccess(null);

    if (!formName.trim()) {
      setErrorMessage('Please provide a name or title!');
      return;
    }

    try {
      setLoading(true);

      const aliases = formAliases
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (!aliases.includes(formName.trim().toLowerCase())) {
        aliases.push(formName.trim().toLowerCase());
      }

      // 1. Resolve Primary Image URL
      let primaryUrl = primaryImageUrlInput.trim();
      if (primaryImageBase64) {
        primaryUrl = await uploadImageToServer(
          primaryImageBase64,
          `${activeTab}_primary_${formName.trim().replace(/\s+/g, '_')}`
        );
      }

      // 2. Resolve Reveal Image URL
      let revealUrl = revealImageUrlInput.trim();
      if (revealImageBase64) {
        revealUrl = await uploadImageToServer(
          revealImageBase64,
          `${activeTab}_reveal_${formName.trim().replace(/\s+/g, '_')}`
        );
      }

      let payload: any = null;

      if (activeTab === 'eyes') {
        if (!primaryUrl) {
          throw new Error('Please upload or provide an eyes crop image!');
        }
        payload = {
          type: 'eyes',
          data: {
            celebrity: formName.trim(),
            aliases,
            eyesCropUrl: primaryUrl,
            fullImageUrl: revealUrl || primaryUrl,
            gender: formGender,
            signatureFeature:
              formFeature.trim() || `Iconic expressive Bollywood ${formGender} gaze.`,
            iconicMovies: formMovie ? [formMovie.trim()] : ['Bollywood Blockbuster'],
            difficulty: 'easy',
          },
        };
      } else if (activeTab === 'silhouettes') {
        if (!primaryUrl) {
          throw new Error('Please upload or provide a silhouette / pose image!');
        }
        payload = {
          type: 'silhouette',
          data: {
            celebrity: formName.trim(),
            aliases,
            silhouetteSvgUrl: primaryUrl,
            originalImageUrl: revealUrl || primaryUrl,
            poseDescription:
              formFeature.trim() || `Iconic Bollywood stance and dance silhouette.`,
            iconicMovieOrSong: formMovie.trim() || 'Bollywood Classic',
            difficulty: 'easy',
          },
        };
      } else if (activeTab === 'frames') {
        payload = {
          type: 'frame',
          data: {
            title: formName.trim(),
            aliases,
            year: Number(formYear) || 2023,
            director: 'Bollywood Director',
            actors: [formFeature.trim() || 'Bollywood Star'],
            frameUrl: primaryUrl || '/assets/frames/custom.svg',
            frameDescription: formMovie.trim() || `Iconic blockbuster scene from ${formName.trim()}.`,
            clue: formClue.trim() || undefined,
            difficulty: 'easy',
          },
        };
      } else if (activeTab === 'dialogues') {
        if (!formDialogue.trim()) {
          throw new Error('Please enter the iconic dialogue!');
        }
        payload = {
          type: 'dialogue',
          data: {
            movie: formName.trim(),
            aliases,
            dialogue: formDialogue.trim(),
            character: formFeature.trim() || 'Lead Character',
            actor: formMovie.trim() || 'Bollywood Star',
            year: Number(formYear) || 2023,
            difficulty: 'easy',
          },
        };
      }

      const res = await fetch('/api/content/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save question to database');
      }

      setUploadSuccess(`Successfully added "${formName.trim()}" to the database! It is now playable in all game lobbies.`);
      
      // Reset form
      setFormName('');
      setFormAliases('');
      setFormFeature('');
      setFormMovie('');
      setFormDialogue('');
      setFormClue('');
      setPrimaryImageBase64('');
      setPrimaryImagePreview('');
      setPrimaryImageUrlInput('');
      setRevealImageBase64('');
      setRevealImagePreview('');
      setRevealImageUrlInput('');

      await loadDatabase();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading question');
    } finally {
      setLoading(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess(`Deleted "${name}" from custom database.`);
        await loadDatabase();
      } else {
        setErrorMessage('Failed to delete item from database.');
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMessage(err.message || 'Delete operation failed');
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

  const handleClearCategory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab }),
      });
      if (res.ok) {
        setUploadSuccess(`Cleared all custom ${activeTab} items.`);
        await loadDatabase();
      }
    } catch (err: any) {
      setErrorMessage('Failed to clear category.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0f0b1d] border border-amber-500/30 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black font-cinzel text-white tracking-wider flex items-center gap-2">
                GUESSVERSE STUDIO & MEDIA DATABASE
              </h2>
              <p className="text-xs text-amber-300/80 font-medium">
                Upload celebrity photos, cropped eyes, silhouettes & dialogues — Nobody Guesses It Better!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 md:px-6 pt-3 pb-1 border-b border-white/10 bg-slate-950/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('eyes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'eyes'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Celebrity Eyes (Round 4)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
              {stats.counts?.eyes ?? 15}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('silhouettes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'silhouettes'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Actress Silhouettes (Round 3)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
              {stats.counts?.silhouettes ?? 15}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('frames')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'frames'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Movie Frames (Round 1)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
              {stats.counts?.frames ?? 30}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dialogues')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dialogues'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Dialogues (Round 2)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
              {stats.counts?.dialogues ?? 25}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>How to Upload & Guide</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Notifications */}
          {uploadSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' ? (
            <div className="space-y-6 text-sm text-slate-300">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30">
                <h3 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  How to Upload Your Bollywood Images & Screenshots
                </h3>
                <p className="text-xs leading-relaxed text-slate-300 mb-4">
                  You can upload your own screenshot references and photos directly using this studio. Any questions or photos you add are stored in the game's database and will appear immediately during multiplayer games!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                      👁️ 1. Celebrity Eyes Images
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      For Round 4, crop an image closely around the actor or actress's eyes (both eyes and eyebrows). Upload that as the <strong>"Cropped Eyes Image"</strong>. Then optionally upload the full face portrait as the <strong>"Reveal Photo"</strong>!
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1.5">
                      💃 2. Actress Silhouette Images
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      For Round 3, select an iconic pose or outline screenshot (e.g. classical mudra, saree pose, iconic dance move). Upload it as the <strong>"Silhouette / Pose Image"</strong>. The system will display it backlit with glowing aura, and reveal the full photo on answer!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                <h4 className="text-sm font-bold text-white mb-2">
                  Direct File Storage Location
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Uploaded image files are saved to the server at <code className="text-amber-300 bg-black/50 px-1.5 py-0.5 rounded">/uploads/</code> and custom questions are persisted to <code className="text-amber-300 bg-black/50 px-1.5 py-0.5 rounded">/server/data/custom_questions.json</code>. You can also copy files directly into the workspace if you prefer code edits!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column (7 cols) */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                      ADD NEW {activeTab.toUpperCase()} TO DATABASE
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Step 1 of 2: Fill Details & Upload
                    </span>
                  </div>

                  {/* Name / Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {activeTab === 'eyes' || activeTab === 'silhouettes'
                        ? 'Celebrity Name *'
                        : 'Movie Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        activeTab === 'eyes'
                          ? 'e.g. Shah Rukh Khan, Ranbir Kapoor'
                          : activeTab === 'silhouettes'
                          ? 'e.g. Deepika Padukone, Alia Bhatt'
                          : 'e.g. Dilwale Dulhania Le Jayenge'
                      }
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 focus:border-amber-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Aliases */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Accepted Answer Aliases (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. srk, shahrukh, shah rukh"
                      value={formAliases}
                      onChange={(e) => setFormAliases(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-600"
                    />
                  </div>

                  {/* Category-specific fields */}
                  {activeTab === 'eyes' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Gender
                        </label>
                        <select
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white focus:outline-none"
                        >
                          <option value="actor">Actor (Male)</option>
                          <option value="actress">Actress (Female)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Iconic Movie
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. DDLJ, War, Animal"
                          value={formMovie}
                          onChange={(e) => setFormMovie(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}

                  {(activeTab === 'eyes' || activeTab === 'silhouettes') && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        {activeTab === 'eyes' ? 'Signature Eye Feature / Clue' : 'Iconic Stance / Pose Description'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          activeTab === 'eyes'
                            ? 'e.g. Deep romantic gaze with signature furrowed brow'
                            : 'e.g. Classical Kathak mudra with royal anarkali drape'
                        }
                        value={formFeature}
                        onChange={(e) => setFormFeature(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder:text-slate-600"
                      />
                    </div>
                  )}

                  {activeTab === 'silhouettes' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Famous Movie / Song
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bajirao Mastani (Deewani Mastani), Gangubai"
                        value={formMovie}
                        onChange={(e) => setFormMovie(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder:text-slate-600"
                      />
                    </div>
                  )}

                  {activeTab === 'dialogues' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Iconic Dialogue Quote *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Don ko pakadna mushkil hi nahi, namumkin hai!"
                        value={formDialogue}
                        onChange={(e) => setFormDialogue(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-600"
                      />
                    </div>
                  )}

                  {/* Primary Image Upload Field (for Eyes, Silhouettes, Frames) */}
                  {activeTab !== 'dialogues' && (
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          {activeTab === 'eyes'
                            ? '1. Cropped Eyes Image (Close-up Macro) *'
                            : activeTab === 'silhouettes'
                            ? '1. Silhouette / Pose Image *'
                            : '1. Movie Frame Scene Image'}
                        </label>

                        {/* File Upload Button + Drop area */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                          <input
                            ref={primaryFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'primary')}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => primaryFileInputRef.current?.click()}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Choose Image File (PNG/JPG)</span>
                          </button>
                          <span className="text-[11px] text-slate-500">or paste URL below</span>
                        </div>

                        <input
                          type="url"
                          placeholder="Or paste external image URL: https://..."
                          value={primaryImageUrlInput}
                          onChange={(e) => {
                            setPrimaryImageUrlInput(e.target.value);
                            setPrimaryImagePreview(e.target.value);
                            setPrimaryImageBase64('');
                          }}
                          className="w-full mt-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-white/10 text-xs text-white placeholder:text-slate-600"
                        />
                      </div>

                      {/* Optional Reveal Full Image */}
                      {(activeTab === 'eyes' || activeTab === 'silhouettes') && (
                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            2. Full Portrait Image for Reveal (Optional)
                          </label>
                          <div className="flex flex-col sm:flex-row items-center gap-2.5">
                            <input
                              ref={revealFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'reveal')}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => revealFileInputRef.current?.click()}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
                              <span>Select Full Reveal Photo</span>
                            </button>
                          </div>
                          <input
                            type="url"
                            placeholder="Or paste reveal photo URL: https://..."
                            value={revealImageUrlInput}
                            onChange={(e) => {
                              setRevealImageUrlInput(e.target.value);
                              setRevealImagePreview(e.target.value);
                              setRevealImageBase64('');
                            }}
                            className="w-full mt-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-white/10 text-xs text-white placeholder:text-slate-600"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Saving to Database...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Save Question to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Preview Column (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 flex flex-col items-center">
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 self-start">
                    LIVE GAMEPLAY PREVIEW
                  </span>

                  {/* Eyes Preview Card */}
                  {activeTab === 'eyes' && (
                    <div className="w-full rounded-2xl border border-emerald-500/40 bg-black/90 p-4 flex flex-col items-center text-center">
                      <div className="w-full h-28 rounded-xl border border-emerald-400/50 bg-neutral-950 flex items-center justify-center overflow-hidden mb-3 relative">
                        {primaryImagePreview ? (
                          <img
                            src={primaryImagePreview}
                            alt="Crop Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-emerald-500/60 text-xs">
                            <Eye className="w-8 h-8 mb-1" />
                            <span>Eyes Image Preview</span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-emerald-400" />
                        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-emerald-400" />
                        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-emerald-400" />
                        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-emerald-400" />
                      </div>

                      <span className="text-xs text-white font-bold">
                        {formName || 'Celebrity Name'}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {formFeature || 'Signature gaze clue'}
                      </span>
                    </div>
                  )}

                  {/* Silhouette Preview Card */}
                  {activeTab === 'silhouettes' && (
                    <div className="w-full rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-black p-4 flex flex-col items-center text-center">
                      <div className="w-full h-36 rounded-xl border border-purple-400/40 bg-[#090414] flex items-center justify-center overflow-hidden mb-3 relative">
                        {primaryImagePreview ? (
                          <img
                            src={primaryImagePreview}
                            alt="Silhouette Preview"
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_12px_rgba(232,121,249,0.7)]"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-purple-400/60 text-xs">
                            <UserCheck className="w-8 h-8 mb-1" />
                            <span>Silhouette Image Preview</span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-white font-bold">
                        {formName || 'Actress Name'}
                      </span>
                      <span className="text-[11px] text-purple-300 font-medium">
                        {formMovie || 'Iconic song / movie'}
                      </span>
                    </div>
                  )}

                  {/* Frame Preview Card */}
                  {activeTab === 'frames' && (
                    <div className="w-full rounded-2xl border border-amber-500/40 bg-black/90 p-4 flex flex-col items-center text-center">
                      <div className="w-full h-32 rounded-xl border border-amber-400/40 bg-neutral-950 flex items-center justify-center overflow-hidden mb-3">
                        {primaryImagePreview ? (
                          <img
                            src={primaryImagePreview}
                            alt="Frame Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-amber-500/60 text-xs">
                            <Film className="w-8 h-8 mb-1" />
                            <span>Movie Scene Preview</span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-white font-bold">
                        {formName || 'Movie Title'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Database Custom Items List */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      CUSTOM ITEMS ({stats.custom?.[activeTab]?.length ?? 0})
                    </span>
                    <div className="flex items-center gap-3">
                      {(stats.custom?.[activeTab]?.length ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCategory}
                          className="text-[11px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={loadDatabase}
                        className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {stats.custom?.[activeTab]?.length ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {stats.custom[activeTab].map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {(item.eyesCropUrl || item.silhouetteSvgUrl || item.frameUrl) && (
                              <img
                                src={item.eyesCropUrl || item.silhouetteSvgUrl || item.frameUrl}
                                alt="Thumb"
                                className="w-7 h-7 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">
                                {item.celebrity || item.title || item.movie}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {item.signatureFeature || item.iconicMovieOrSong || item.dialogue}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item.id, item.celebrity || item.title || item.movie)
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 hover:text-red-100 transition-colors cursor-pointer shrink-0 ml-2 shadow-xs"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold">Delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-3">
                      No custom {activeTab} added yet. Add one above!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
