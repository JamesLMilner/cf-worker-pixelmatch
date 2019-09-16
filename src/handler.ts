// @ts-ignore
import { PNG } from 'pngjs/browser';
const str = require('string-to-stream');
const base64 = require('base64-arraybuffer');
import { DiffImageRequest } from './types';
const loader = require("assemblyscript/lib/loader");
//@ts-ignore
const pixelmatch = loader.instantiate(wasmprogram);

export async function handleRequest(request: Request): Promise<Response> {

	if (request.method === "POST") {
		return await performPixelmatch(await request.json());
	} 
	
	return new Response('Needs to be a POST', { status: 400 })
}

async function performPixelmatch(json: DiffImageRequest) {

	if (!json.imgOne || !json.imgTwo) {
		return new Response("Requires correctly formed JSON payload", { status: 400 });
	}

	if (!isBase64PNG(json.imgOne) || !isBase64PNG(json.imgTwo)) {
		return new Response("Both images need to be a base64 encoded PNG", { status: 400 });
	}

	const options = {
		threshold: 0.1,         // matching threshold (0 to 1); smaller is more sensitive
		includeAA: false,       // whether to skip anti-aliasing detection
		alpha: 0.1,             // opacity of original image in diff ouput
		aaColor: [255, 255, 0], // color of anti-aliased pixels in diff output
		diffColor: [255, 0, 0]  // color of different pixels in diff output
	};

	let img1: PNG;
	let img2: PNG;

	try {
		img1 = await getImage(json.imgOne);
	} catch (error) {
		return new Response("Error reading image one: " + error, { status: 500 });
	}

	try {
		img2 = await getImage(json.imgTwo);
	} catch (error) {
		return new Response("Error reading image two: " + error, { status: 500 });
	}
	
	const {width, height} = img1;
	const diffPNG = new PNG({ width, height });
	let mismatch;

	try {

		const wasmModule = pixelmatch;

		// @ts-ignore
		const {
			__allocArray,
			__retain,
			__release,
			__getArrayView
		} = wasmModule;

		const ptr1 = __retain(__allocArray((wasmModule as any).Uint8Array_ID, img1.data));
		const ptr2 = __retain(__allocArray((wasmModule as any).Uint8Array_ID, img2.data));
		const diffPtr = __retain(__allocArray((wasmModule as any).Uint8Array_ID, diffPNG.data));
	
		mismatch = (wasmModule as any).pixelmatch(
				ptr1,
				ptr2,
				diffPtr,
				width,
				height,
				options.threshold,
				options.includeAA,
				options.alpha,
				options.aaColor && options.aaColor[0],
				options.aaColor && options.aaColor[1],
				options.aaColor && options.aaColor[2],
				options.diffColor && options.diffColor[0],
				options.diffColor && options.diffColor[1],
				options.diffColor && options.diffColor[2]
		);
		diffPNG.data = new Uint8Array(__getArrayView(diffPtr));

		__release(ptr1);
		__release(ptr2);
		__release(diffPtr);

	} catch (error) {
		return new Response("Error performing pixelmatch" + error, { status: 500 });
	}

	let payload;
	try {
		const diffImg = PNG.sync.write(diffPNG);
		payload = JSON.stringify({ mismatch, diff: base64.encode(diffImg) })
	} catch (error) {
		return new Response("Error writing difference image" + error, { status: 500 });
	}

	return new Response(payload, {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
	})

}

function isBase64PNG(base64img: string) {
	return base64img.startsWith("data:image/png;base64");
}

async function getImage(image: string): Promise<PNG> {
	return new Promise((resolve) => {
		str(base64.decode(image.split(",")[1]) as any)
			.pipe(
				new PNG({
					filterType: 4
				})
			)
			.on("parsed", function() {
				//@ts-ignore
				resolve(this);
			});
	});
}

