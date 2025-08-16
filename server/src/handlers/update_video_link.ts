import { db } from '../db';
import { videoLinksTable } from '../db/schema';
import { type UpdateVideoLinkInput, type VideoLink } from '../schema';
import { eq } from 'drizzle-orm';

export const updateVideoLink = async (input: UpdateVideoLinkInput): Promise<VideoLink> => {
  try {
    // First, check if the video link exists
    const existingLink = await db.select()
      .from(videoLinksTable)
      .where(eq(videoLinksTable.id, input.id))
      .execute();

    if (existingLink.length === 0) {
      throw new Error(`Video link with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    // Add only the fields that are provided in the input
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.thumbnail_url !== undefined) {
      updateData.thumbnail_url = input.thumbnail_url;
    }
    if (input.file_size !== undefined) {
      updateData.file_size = input.file_size;
    }
    if (input.duration !== undefined) {
      updateData.duration = input.duration;
    }
    if (input.error_message !== undefined) {
      updateData.error_message = input.error_message;
    }
    if (input.telegram_bot_id !== undefined) {
      updateData.telegram_bot_id = input.telegram_bot_id;
    }
    if (input.telegram_file_id !== undefined) {
      updateData.telegram_file_id = input.telegram_file_id;
    }
    if (input.telegram_message_link !== undefined) {
      updateData.telegram_message_link = input.telegram_message_link;
    }
    if (input.downloaded_at !== undefined) {
      updateData.downloaded_at = input.downloaded_at;
    }
    if (input.uploaded_at !== undefined) {
      updateData.uploaded_at = input.uploaded_at;
    }

    // Update the video link
    const result = await db.update(videoLinksTable)
      .set(updateData)
      .where(eq(videoLinksTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Video link update failed:', error);
    throw error;
  }
};