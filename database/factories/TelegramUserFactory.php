<?php

namespace Database\Factories;

use App\Models\TelegramUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TelegramUser>
 */
class TelegramUserFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\TelegramUser>
     */
    protected $model = TelegramUser::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'telegram_id' => (string) fake()->unique()->numberBetween(100000000, 999999999),
            'username' => fake()->optional()->userName(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->optional()->lastName(),
            'is_whitelisted' => fake()->boolean(30), // 30% chance of being whitelisted
            'has_started_bot' => fake()->boolean(80), // 80% chance of having started the bot
        ];
    }

    /**
     * Indicate that the telegram user is whitelisted.
     */
    public function whitelisted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_whitelisted' => true,
            'has_started_bot' => true,
        ]);
    }

    /**
     * Indicate that the telegram user has not started the bot.
     */
    public function notStarted(): static
    {
        return $this->state(fn (array $attributes) => [
            'has_started_bot' => false,
        ]);
    }
}