import sharp from 'sharp';
import puppeteer from 'puppeteer';

/**
 * A function that captures a screenshot of a GitHub user's profile README and saves it as a static or animated webp file
 * @param {String} path - The file path to save the screenshot to
 * @param {String} userName - The GitHub username of the user whose README to capture
 * @return {Promise<Object>} - The result of the screenshot saving process
 */
const captureScreenshot = async (path, userName) => {
	// Define browser and page variables
	const browser = await puppeteer.launch({
		args: ['--no-sandbox'] // disable sandboxing for safety
	});
	const url = `https://github.com/${userName}`;
	const windowWidth = 1400;
	const minWindowHeight = 800;

	// Create new page and navigate to the user's GitHub profile
	const page = await browser.newPage();
	try {
		await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
	} catch (error) {
		console.error(error);
		throw error;
	}

	// Set the viewport height
	await page.setViewport({
		width: windowWidth,
		height: 5000
	});

	// Get the README DOM height
	let domHeight = await page.evaluate(() => {
		const domPath = 'div.profile-readme';
		const readme = document.querySelector(domPath);
		return readme ? readme.getBoundingClientRect().bottom : 0;
	});

	// If the DOM height is higher than minWindowHeight, use that for the viewport height
	const windowHeight = domHeight > minWindowHeight ? domHeight : minWindowHeight;

	// Take screenshot of README and save as JPEG
	const buffer = await page.screenshot({
		clip: {
			width: windowWidth,
			height: windowHeight - 54,
			x: 0,
			y: 83 // remove navbar
		}
	});

	// Save the screenshot as a webp file
	let result = await sharp(buffer)
		.resize(800)
		.webp({
			quality: 50
		})
		.toFile(`${path}/${userName}.webp`);

	// wait 2s before closing the browser
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// Close the page and browser
	await page.close();
	await browser.close();

	return result;
};

export default captureScreenshot;
