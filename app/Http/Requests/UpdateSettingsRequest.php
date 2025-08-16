<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'app_name' => 'nullable|string|max:255',
            'app_description' => 'nullable|string|max:500',
            'app_logo' => 'nullable|url',
            'telegram_bot_token' => 'nullable|string|max:255',
            'telegram_bot_username' => 'nullable|string|max:255',
            'telegram_channel_id' => 'nullable|string|max:255',
            'whitelist_enabled' => 'boolean',
            'theme' => 'nullable|string|in:light,dark',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'app_name.max' => 'App name cannot exceed 255 characters.',
            'app_description.max' => 'App description cannot exceed 500 characters.',
            'app_logo.url' => 'App logo must be a valid URL.',
            'telegram_bot_token.max' => 'Telegram bot token cannot exceed 255 characters.',
            'telegram_bot_username.max' => 'Telegram bot username cannot exceed 255 characters.',
            'telegram_channel_id.max' => 'Telegram channel ID cannot exceed 255 characters.',
            'theme.in' => 'Theme must be either light or dark.',
        ];
    }
}