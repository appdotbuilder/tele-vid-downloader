<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\Video
 *
 * @property int $id
 * @property int $user_id
 * @property string $url
 * @property string|null $platform
 * @property string|null $title
 * @property string|null $filename
 * @property string|null $file_path
 * @property int|null $file_size
 * @property string|null $duration
 * @property string $status
 * @property string|null $telegram_message_id
 * @property string|null $telegram_file_url
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|Video newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Video newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Video query()
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereErrorMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video wherePlatform($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereTelegramFileUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereTelegramMessageId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereUrl($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Video whereUserId($value)
 * @method static \Database\Factories\VideoFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class Video extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'url',
        'platform',
        'title',
        'filename',
        'file_path',
        'file_size',
        'duration',
        'status',
        'telegram_message_id',
        'telegram_file_url',
        'error_message',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the video.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the platform display name.
     */
    public function getPlatformDisplayAttribute(): string
    {
        return match($this->platform) {
            'youtube' => 'YouTube',
            'instagram' => 'Instagram',
            'twitter' => 'Twitter',
            'doodstream' => 'DoodStream',
            default => 'Unknown',
        };
    }

    /**
     * Get the status display name.
     */
    public function getStatusDisplayAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending',
            'processing' => 'Processing',
            'completed' => 'Completed',
            'failed' => 'Failed',
            default => 'Unknown',
        };
    }

    /**
     * Get formatted file size.
     */
    public function getFormattedFileSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'Unknown';
        }

        $size = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        
        return round($size, 2) . ' ' . $units[$i];
    }
}