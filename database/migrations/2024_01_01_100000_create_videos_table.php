<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('url');
            $table->enum('platform', ['youtube', 'instagram', 'twitter', 'doodstream'])->nullable();
            $table->string('title')->nullable();
            $table->string('filename')->nullable();
            $table->string('file_path')->nullable();
            $table->integer('file_size')->nullable();
            $table->string('duration')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->string('telegram_message_id')->nullable();
            $table->string('telegram_file_url')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('status');
            $table->index('platform');
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};