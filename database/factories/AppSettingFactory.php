<?php

namespace Database\Factories;

use App\Models\AppSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AppSetting>
 */
class AppSettingFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\AppSetting>
     */
    protected $model = AppSetting::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->word(),
            'value' => fake()->sentence(),
            'type' => 'string',
        ];
    }

    /**
     * Indicate that the setting is a boolean type.
     */
    public function boolean(): static
    {
        return $this->state(fn (array $attributes) => [
            'value' => fake()->boolean() ? '1' : '0',
            'type' => 'boolean',
        ]);
    }

    /**
     * Indicate that the setting is an integer type.
     */
    public function integer(): static
    {
        return $this->state(fn (array $attributes) => [
            'value' => (string) fake()->numberBetween(1, 1000),
            'type' => 'integer',
        ]);
    }

    /**
     * Indicate that the setting is a JSON type.
     */
    public function json(): static
    {
        return $this->state(fn (array $attributes) => [
            'value' => json_encode(['key' => fake()->word(), 'value' => fake()->word()]),
            'type' => 'json',
        ]);
    }
}