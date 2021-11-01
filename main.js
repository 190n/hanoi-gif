import Tarball from './tarball.js';

const canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d'),
	width = 810,
	height = 380,
	maxRingWidth = 240,
	numRings = 8,
	size = 28,
	textHeight = 80;

const rings = [[], [], []];

for (let i = numRings - 1; i >= 0; i -= 1) {
	rings[0].push(i);
}

function drawBase() {
	ctx.fillStyle = 'black';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '900 48px Spartan';
	ctx.translate(width / 2, 0);
	ctx.scale(0.75, 1);
	ctx.fillText('get real', 0, textHeight / 2);
	ctx.resetTransform();

	ctx.fillStyle = 'silver';
	// rods
	ctx.fillRect(width / 6 - size / 4, textHeight, size / 2, height - textHeight);
	ctx.fillRect(width / 2 - size / 4, textHeight, size / 2, height - textHeight);
	ctx.fillRect(5 * width / 6 - size / 4, textHeight, size / 2, height - textHeight);
	// base
	ctx.fillStyle = 'gray';
	ctx.fillRect(0, height - size, width, size);
}

function getRingColor(r) {
	const hue = r / numRings * 360;
	return `hsl(${hue}deg, 100%, 50%)`;
}

function drawStack(stack, rodX) {
	let y = height - 1.5 * size;
	for (const r of stack) {
		ctx.fillStyle = getRingColor(r);
		const width = Math.round((r + 2) / (numRings + 1) * maxRingWidth / 2) * 2;
		ctx.fillRect(rodX - width / 2, y - size / 2, width, size);
		y -= size;
	}
}

function drawRings() {
	drawStack(rings[0], width / 6);
	drawStack(rings[1], width / 2);
	drawStack(rings[2], 5 * width / 6);
}

function moveRing(from, to) {
	if (rings[from].length > 0) {
		const fromTop = rings[from][rings[from].length - 1],
			toTop = rings[to][rings[to].length - 1] ?? Infinity;

		if (toTop > fromTop) {
			rings[to].push(rings[from].pop());
		} else {
			throw new Error('attempt to move ring onto smaller ring');
		}
	} else {
		throw new Error('attempt to move ring from empty stack');
	}
}

function* moveRings(from, to, n) {
	if (n == 1) {
		yield [from, to];
	} else {
		const thirdRod = [0, 1, 2].find(x => x != from && x != to);
		yield* moveRings(from, thirdRod, n - 1);
		yield [from, to];
		yield* moveRings(thirdRod, to, n - 1);
	}
}

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, width, height);
drawBase();
drawRings();
ctx.fillStyle = 'black';
ctx.textAlign = 'right';
ctx.textBaseline = 'middle';
ctx.font = '500 24px Roboto';
ctx.fillText(`0 moves`, width - 8, textHeight / 2);

const tar = new Tarball();
let moves = 0, frame = 1;

(async () => {
	function addFrame(blob) {
		tar.addFile('0'.repeat(5 - frame.toString().length) + frame.toString() + '.png', blob);
		frame += 1;
	}

	function renderBlob() {
		return new Promise(resolve => {
			canvas.toBlob(blob => resolve(blob), 'image/png');
		});
	}

	let blob = await renderBlob();
	for (let i = 0; i < 30; i += 1) {
		addFrame(blob);
	}

	for (const [from, to] of moveRings(0, 2, numRings)) {
		moveRing(from, to);
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, width, height);
		drawBase();
		drawRings();
		moves += 1;
		ctx.fillStyle = 'black';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		ctx.font = '500 24px Roboto';
		ctx.fillText(`${moves} moves`, width - 8, textHeight / 2);
		
		const blob = await renderBlob();
		addFrame(blob);
	}

	blob = await renderBlob();
	for (let i = 0; i < 30; i += 1) {
		addFrame(blob);
	}

	document.getElementById('download').href = URL.createObjectURL(tar.generate());
	document.getElementById('download').textContent = 'Download tarball';
})();
