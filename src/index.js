const puppeteer = require('puppeteer');
const fs = require('fs')
const request = require('request')

const download = async (url, path, callback) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}


let scrape = async (url) => {
    const browser = await puppeteer.launch({ 
        executablePath: '/usr/bin/google-chrome-stable',
        headless: false 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    try{
        await page.goto(url, [1000, { waitUntil: "domcontentloaded" }]);
        await page.waitForSelector('body');
        data = {
            "seccion" : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-seccion.field-type-taxonomy-term-reference.field-label-hidden > div > div > a').innerText),
            "titulo"  : await page.evaluate(() => document.querySelector('#content-wrapper > h1.page-title').innerText),
            "imagen"  : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-imagen-principal.field-type-image.field-label-hidden > div > div > picture > img').getAttribute('src').replace('/', '')),
            "filename" : Math.random().toString(36).substr(2, 9) + ".png",
            "fecha"   : await page.evaluate(() => document.querySelector('#block-system-main > div > div > span.submitted-by').innerText),
            "cuerpo"  : await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-body.field-type-text-with-summary.field-label-hidden').innerHTML),
        }

       

        await page.goto(data.imagen);
        await page.waitForSelector('body');
        const elem = await page.$('body > img');
        const boundingBox = await elem.boundingBox();
        console.log('boundingBox', boundingBox);
        const image = await page.screenshot({
            path: data.filename,
            clip: boundingBox
        });

        await page.close();
        let  pageToUp = await  browser.newPage();
        await pageToUp.goto('http://digital.ga/user/login');
        await pageToUp.waitForSelector('body');
        await pageToUp.type('#edit-name', '');
        await pageToUp.type('#edit-pass', '');
        await pageToUp.click('#edit-submit', {delay: 1000});
        await pageToUp.waitForTimeout(5000);
        await pageToUp.goto('http://digital.ga/node/add/noticia');
        await pageToUp.waitForTimeout(1000);

        await pageToUp.type('#edit-title-0-value', data.titulo);
        let value = await getOptionValue(data.seccion);
        await pageToUp.select('#edit-field-seccion', value);
        //body
        await pageToUp.type('#cke_1_contents > iframe', data.cuerpo);

        


        //await browser.close();
        console.log(data);
    }catch(e){
        console.log(e);
    }
    
}

let getOptionValue = async (opt) =>{
    opt = opt.toLowerCase();
    if(opt === 'archivo') return '11';
    if(opt === 'cultura') return '5';
    if(opt === 'deportes') return '1';
    if(opt === 'economia') return '2';
    if(opt === 'interés general') return '10';
    if(opt === 'judiciales') return '3';
    if(opt === 'locales') return '9';
    if(opt === 'nacionales') return '7';
    if(opt === 'opinión') return '6';
    if(opt === 'policiales') return '4';
    if(opt === 'provinciales') return '8';

    return '_none';
}

scrape("https://www.analisisdigital.com.ar/opinion/2021/08/25/es-poco-probable-que-los-perpetradores-enfrenten-la-justicia");
