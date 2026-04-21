import mongoose, { Document, Schema } from 'mongoose';

export interface ISong {
  _id: mongoose.Types.ObjectId;
  title: string;
  videoId: string;
  isLocal: boolean;
  cloudinaryUrl?: string;
  rating: number;
  addedAt: Date;
}

export interface IPlaylist extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  songs: ISong[];
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema = new Schema<ISong>(
  {
    title: { type: String, required: true },
    videoId: { type: String, required: true },
    isLocal: { type: Boolean, default: false },
    cloudinaryUrl: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PlaylistSchema = new Schema<IPlaylist>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    songs: { type: [SongSchema], default: [] },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
