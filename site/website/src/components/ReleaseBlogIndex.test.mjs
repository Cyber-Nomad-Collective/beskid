import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const blogIndex = readFileSync(new URL('./ReleaseBlogIndex.astro', import.meta.url), 'utf8');
const blogCard = readFileSync(new URL('./blog/BlogPostCard.tsx', import.meta.url), 'utf8');

test('the blog index uses reusable React post tiles with public-domain thumbnails', () => {
	assert.match(blogIndex, /\{ BlogPostCard \} from '\.\/blog\/BlogPostCard\.tsx'/);
	assert.match(blogIndex, /Among_the_Sierra_Nevada/);
	assert.match(blogIndex, /Special:FilePath\/NASAComputerRoom7090/);
	assert.match(blogIndex, /Special:FilePath\/IBM_3151_terminal/);
	assert.match(blogIndex, /<BlogPostCard/);
});

test('the blog separates recent image cards from a compact text-first archive', () => {
	assert.match(blogIndex, /const recent = entriesByDate\.slice\(0, 5\)/);
	assert.match(blogIndex, /const archive = entriesByDate\.slice\(5\)/);
	assert.match(blogIndex, /<section class="blog__recent"/);
	assert.match(blogIndex, /variant="recent"/);
	assert.match(blogIndex, /variant="compact"/);
	assert.doesNotMatch(blogIndex, /blog__feature/);
	assert.match(blogCard, /<figure className="blog-card__figure">/);
	assert.match(blogCard, /<figcaption>/);
});

test('the blog layout removes the empty documentation gutter and renders a tile grid', () => {
	assert.match(blogIndex, /\.main-frame/);
	assert.match(blogIndex, /grid-template-columns: repeat\(auto-fit, minmax\(15rem, 1fr\)\)/);
	assert.doesNotMatch(blogIndex, /Release notes, engineering essays/);
});

test('the blog lets dated posts speak for themselves without status badges', () => {
	assert.doesNotMatch(blogIndex, /blogStatusLabel/);
	assert.doesNotMatch(blogIndex, /blog__status/);
	assert.doesNotMatch(blogIndex, /Latest post/);
	assert.doesNotMatch(blogCard, /status:/);
	assert.match(blogIndex, /From the archive/);
});
