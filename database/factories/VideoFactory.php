<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Video>
 */
class VideoFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\Video>
     */
    protected $model = Video::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $platforms = ['youtube', 'instagram', 'twitter', 'doodstream'];
        $platform = fake()->randomElement($platforms);
        
        $urls = [
            'youtube' => 'https://youtube.com/watch?v=' . fake()->regexify('[a-zA-Z0-9]{11}'),
            'instagram' => 'https://instagram.com/p/' . fake()->regexify('[a-zA-Z0-9_-]{11}'),
            'twitter' => 'https://twitter.com/user/status/' . fake()->numberBetween(1000000000000000000, 9999999999999999999),
            'doodstream' => 'https://doodstream.com/e/' . fake()->regexify('[a-zA-Z0-9]{12}'),
        ];

        return [
            'user_id' => User::factory(),
            'url' => $urls[$platform],
            'platform' => $platform,
            'title' => fake()->sentence(3),
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'failed']),
            'filename' => fake()->optional()->regexify('[a-zA-Z0-9_-]{8}') . '.mp4',
            'file_path' => fake()->optional()->filePath(),
            'file_size' => fake()->optional()->numberBetween(1024*1024, 100*1024*1024), // 1MB to 100MB
            'duration' => fake()->optional()->time('H:i:s'),
            'telegram_message_id' => fake()->optional()->numberBetween(1, 999999),
            'telegram_file_url' => fake()->optional()->url(),
            'error_message' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the video is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'filename' => fake()->regexify('[a-zA-Z0-9_-]{8}') . '.mp4',
            'file_path' => 'videos/' . fake()->regexify('[a-zA-Z0-9_-]{8}') . '.mp4',
            'file_size' => fake()->numberBetween(5*1024*1024, 50*1024*1024), // 5MB to 50MB
            'duration' => fake()->time('H:i:s'),
            'telegram_message_id' => fake()->numberBetween(1, 999999),
            'telegram_file_url' => 'https://t.me/c/' . fake()->numberBetween(1000000000, 9999999999) . '/' . fake()->numberBetween(1, 999999),
            'error_message' => null,
        ]);
    }

    /**
     * Indicate that the video is processing.
     */
    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
            'filename' => null,
            'file_path' => null,
            'file_size' => null,
            'duration' => null,
            'telegram_message_id' => null,
            'telegram_file_url' => null,
            'error_message' => null,
        ]);
    }

    /**
     * Indicate that the video failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'filename' => null,
            'file_path' => null,
            'file_size' => null,
            'duration' => null,
            'telegram_message_id' => null,
            'telegram_file_url' => null,
            'error_message' => fake()->sentence(),
        ]);
    }
}