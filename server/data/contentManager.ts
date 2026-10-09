import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  MovieFrameQuestion,
  DialogueQuestion,
  SilhouetteQuestion,
  EyesQuestion,
} from '../../shared/types.ts';
import {
  MOVIE_FRAMES,
  DIALOGUES,
  SILHOUETTES,
  CELEBRITY_EYES,
} from './questions.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, 'custom_questions.json');

export interface CustomDatabase {
  frames: MovieFrameQuestion[];
  dialogues: DialogueQuestion[];
  silhouettes: SilhouetteQuestion[];
  eyes: EyesQuestion[];
}

class ContentManager {
  private customData: CustomDatabase = {
    frames: [],
    dialogues: [],
    silhouettes: [],
    eyes: [],
  };

  constructor() {
    this.loadCustomData();
  }

  private loadCustomData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.customData = {
          frames: parsed.frames || [],
          dialogues: parsed.dialogues || [],
          silhouettes: parsed.silhouettes || [],
          eyes: parsed.eyes || [],
        };
      } else {
        this.saveCustomData();
      }
    } catch (err) {
      console.error('Error loading custom questions database:', err);
    }
  }

  private saveCustomData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.customData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving custom questions database:', err);
    }
  }

  public getAllFrames(): MovieFrameQuestion[] {
    return [...this.customData.frames, ...MOVIE_FRAMES];
  }

  public getAllDialogues(): DialogueQuestion[] {
    return [...this.customData.dialogues, ...DIALOGUES];
  }

  public getAllSilhouettes(): SilhouetteQuestion[] {
    return [...this.customData.silhouettes, ...SILHOUETTES];
  }

  public getAllEyes(): EyesQuestion[] {
    return [...this.customData.eyes, ...CELEBRITY_EYES];
  }

  public getCustomDatabase(): CustomDatabase {
    return { ...this.customData };
  }

  public addFrame(question: Omit<MovieFrameQuestion, 'id'>): MovieFrameQuestion {
    const newQuestion: MovieFrameQuestion = {
      ...question,
      id: `custom_frame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.customData.frames.unshift(newQuestion);
    this.saveCustomData();
    return newQuestion;
  }

  public addDialogue(question: Omit<DialogueQuestion, 'id'>): DialogueQuestion {
    const newQuestion: DialogueQuestion = {
      ...question,
      id: `custom_diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.customData.dialogues.unshift(newQuestion);
    this.saveCustomData();
    return newQuestion;
  }

  public addSilhouette(question: Omit<SilhouetteQuestion, 'id'>): SilhouetteQuestion {
    const newQuestion: SilhouetteQuestion = {
      ...question,
      id: `custom_sil_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.customData.silhouettes.unshift(newQuestion);
    this.saveCustomData();
    return newQuestion;
  }

  public addEyes(question: Omit<EyesQuestion, 'id'>): EyesQuestion {
    const newQuestion: EyesQuestion = {
      ...question,
      id: `custom_eyes_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.customData.eyes.unshift(newQuestion);
    this.saveCustomData();
    return newQuestion;
  }

  public deleteItem(id: string): boolean {
    let deleted = false;
    const prevFrames = this.customData.frames.length;
    this.customData.frames = this.customData.frames.filter((q) => q.id !== id);
    if (this.customData.frames.length !== prevFrames) deleted = true;

    const prevDiag = this.customData.dialogues.length;
    this.customData.dialogues = this.customData.dialogues.filter((q) => q.id !== id);
    if (this.customData.dialogues.length !== prevDiag) deleted = true;

    const prevSil = this.customData.silhouettes.length;
    this.customData.silhouettes = this.customData.silhouettes.filter((q) => q.id !== id);
    if (this.customData.silhouettes.length !== prevSil) deleted = true;

    const prevEyes = this.customData.eyes.length;
    this.customData.eyes = this.customData.eyes.filter((q) => q.id !== id);
    if (this.customData.eyes.length !== prevEyes) deleted = true;

    if (deleted) {
      this.saveCustomData();
    }
    return deleted;
  }

  public clearAll(category?: 'eyes' | 'silhouettes' | 'frames' | 'dialogues' | 'all'): boolean {
    if (!category || category === 'all') {
      this.customData = { frames: [], dialogues: [], silhouettes: [], eyes: [] };
    } else if (category === 'eyes') {
      this.customData.eyes = [];
    } else if (category === 'silhouettes') {
      this.customData.silhouettes = [];
    } else if (category === 'frames') {
      this.customData.frames = [];
    } else if (category === 'dialogues') {
      this.customData.dialogues = [];
    }
    this.saveCustomData();
    return true;
  }
}

export const contentManager = new ContentManager();
