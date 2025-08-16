<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoRequest extends FormRequest
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
            'url' => [
                'required',
                'url',
                'regex:/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|instagram\.com|twitter\.com|x\.com|doodstream\.com)\/.*$/',
            ],
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
            'url.required' => 'Video URL is required.',
            'url.url' => 'Please provide a valid URL.',
            'url.regex' => 'URL must be from a supported platform (YouTube, Instagram, Twitter, or DoodStream).',
        ];
    }
}