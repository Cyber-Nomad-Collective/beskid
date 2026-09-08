import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const blogIndex = readFileSync(new URL('./ReleaseBlogIndex.astro', import.meta.url), 'utf8');
const blogCard = readFileSync(new URL('./blog/BlogPostCard.tsx', import.meta.url), 'utf8');

test('the blog index uses reusable React post tiles with public-domain thumbnails', () => {
	assert.match(blogIndex, /\{ BlogPostCard \} from '\.\/blog\/BlogPostCard\.tsx'/);
	assert.match(blogIndex, /Special:FilePath\/G%C5%82owacki/);
	assert.match(blogIndex, /Special:FilePath\/COMPUTER%20TERMINAL/);
	assert.match(blogIndex, /<BlogPostCard/);
});

test('the blog layout removes the empty documentation gutter and renders a tile grid', () => {
	assert.match(blogIndex, /\.main-frame/);
	assert.match(blogIndex, /grid-template-columns: repeat\(auto-fit, minmax\(18rem, 1fr\)\)/);
	assert.doesNotMatch(blogIndex, /Release notes, engineering essays/);
});

test('the blog lets dated posts speak for themselves without status badges', () => {
	assert.doesNotMatch(blogIndex, /blogStatusLabel/);
	assert.doesNotMatch(blogIndex, /blog__status/);
	assert.doesNotMatch(blogIndex, /Latest post/);
	assert.doesNotMatch(blogCard, /status:/);
	assert.match(blogIndex, /From the archive/);
});
