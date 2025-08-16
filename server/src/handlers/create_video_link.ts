import { db } from '../db';
import { videoLinksTable, usersTable } from '../db/schema';
import { type CreateVideoLinkInput, type VideoLink, type Platform } from '../schema';
import { eq } from 'drizzle-orm';

// Platform detection based on URL patterns
const detectPlatform = (url: string): Platform => {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  } else if (urlLower.includes('instagram.com')) {
    return 'instagram';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  } else if (urlLower.includes('doodstream.com')) {
    return 'doodstream';
  } else {
    return 'other';
  }
};

export const createVideoLink = async (input: CreateVideoLinkInput): Promise<VideoLink> => {
  try {
    // Verify that the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    // Auto-detect platform if not provided
    const platform = input.platform || detectPlatform(input.url);

    // Insert the new video link record
    const result = await db.insert(videoLinksTable)
      .values({
        user_id: input.user_id,
        url: input.url,
        platform: platform,
        status: 'pending'
      })
      .returning()
      .execute();

    const videoLink = result[0];
    return {
      ...videoLink,
      // Convert timestamp fields to Date objects if needed
      created_at: videoLink.created_at instanceof Date ? videoLink.created_at : new Date(videoLink.created_at),
      updated_at: videoLink.updated_at instanceof Date ? videoLink.updated_at : new Date(videoLink.updated_at),
      downloaded_at: videoLink.downloaded_at ? (videoLink.downloaded_at instanceof Date ? videoLink.downloaded_at : new Date(videoLink.downloaded_at)) : null,
      uploaded_at: videoLink.uploaded_at ? (videoLink.uploaded_at instanceof Date ? videoLink.uploaded_at : new Date(videoLink.uploaded_at)) : null
    };
  } catch (error) {
    console.error('Video link creation failed:', error);
    throw error;
  }
};