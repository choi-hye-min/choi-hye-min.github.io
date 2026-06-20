# frozen_string_literal: true

require "fileutils"
require "json"

USAGE = 'Usage: ruby scripts/new_post.rb "Post title" english-slug'
SLUG_PATTERN = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/

title, slug = ARGV

if ARGV.length != 2 || title.strip.empty?
  warn USAGE
  exit 1
end

unless SLUG_PATTERN.match?(slug)
  warn "Slug must contain only lowercase letters, numbers, and single hyphens."
  exit 1
end

published_at = Time.now.getlocal("+09:00")
repository_root = File.expand_path("..", __dir__)
post_directory = File.join(repository_root, "_posts", published_at.strftime("%Y"))
post_path = File.join(
  post_directory,
  "#{published_at.strftime('%Y-%m-%d')}-#{slug}.md"
)

front_matter = <<~MARKDOWN
  ---
  layout: post
  title: #{JSON.generate(title)}
  date: #{published_at.strftime('%Y-%m-%d %H:%M:%S %z')}
  categories: []
  tags: []
  ---

MARKDOWN

FileUtils.mkdir_p(post_directory)

begin
  File.open(post_path, File::WRONLY | File::CREAT | File::EXCL, encoding: "UTF-8") do |file|
    file.write(front_matter)
  end
rescue Errno::EEXIST
  warn "Post already exists: #{post_path}"
  exit 1
end

puts "Created #{post_path}"
