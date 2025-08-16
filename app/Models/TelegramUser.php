<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\TelegramUser
 *
 * @property int $id
 * @property int $user_id
 * @property string $telegram_id
 * @property string|null $username
 * @property string|null $first_name
 * @property string|null $last_name
 * @property bool $is_whitelisted
 * @property bool $has_started_bot
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser query()
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereFirstName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereHasStartedBot($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereIsWhitelisted($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereLastName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereTelegramId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|TelegramUser whereUsername($value)
 * @method static \Database\Factories\TelegramUserFactory factory($count = null, $state = [])
 * 
 * @mixin \Eloquent
 */
class TelegramUser extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'telegram_id',
        'username',
        'first_name',
        'last_name',
        'is_whitelisted',
        'has_started_bot',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_whitelisted' => 'boolean',
        'has_started_bot' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns this telegram user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full name of the telegram user.
     */
    public function getFullNameAttribute(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }

    /**
     * Get the display name of the telegram user.
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->username) {
            return '@' . $this->username;
        }
        
        return $this->full_name ?: 'Telegram User';
    }
}