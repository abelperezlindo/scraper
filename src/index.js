const puppeteer = require('puppeteer');
const fs = require('fs')
const request = require('request');
const getter = require('./urlGetter.js');



let scrape = async (url) => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome-stable',
        headless: false
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setDefaultNavigationTimeout(0);
    try {
        await page.goto(url, [1000, { waitUntil: "domcontentloaded" }]);
        await page.waitForSelector('body');

        let relacionados = await page.evaluate(() => {
            let related = new Array();
            let links = document.querySelector('#block-system-main > div > div > div.field.field-name-field-temas-relacionados.field-type-taxonomy-term-reference.field-label-above');
            if (links) {
                links = links.getElementsByTagName('a');
                for (let item of links) {
                    let r = item.innerText.toLowerCase();
                    r = r[0].toUpperCase() + r.slice(1);
                    console.log(r);
                    related.push(r);
                }
                return related;
            }

            return false;

        });
        if (relacionados !== false) {
            relacionados.forEach(element => console.log('related: ' + element));
        }

        data = {
            "seccion": await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-seccion.field-type-taxonomy-term-reference.field-label-hidden > div > div > a').innerText),
            "titulo": await page.evaluate(() => document.querySelector('#content-wrapper > h1.page-title').innerText),
            "imagen": await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-field-imagen-principal.field-type-image.field-label-hidden > div > div > picture > img').getAttribute('src').replace('/', '')),
            "filename": Math.random().toString(36).substr(2, 9) + ".png",
            "fecha": await page.evaluate(() => document.querySelector('#block-system-main > div > div > span.submitted-by').innerText),
            "cuerpo": await page.evaluate(() => document.querySelector('#block-system-main > div > div > div.field.field-name-body.field-type-text-with-summary.field-label-hidden').innerHTML),
            "relacionados": relacionados
        }


        await page.goto(data.imagen);
        await page.waitForSelector('body > img');
        const elem = await page.$('body > img');
        const boundingBox = await elem.boundingBox();
        const image = await page.screenshot({
            path: data.filename,
            clip: boundingBox
        });

        await page.goto('http://digital.ga/user/login', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#edit-name');
        await page.type('#edit-name', '', {delay: 10});
        await page.type('#edit-pass', '', {delay: 10});
        await page.click('#edit-submit', { delay: 500 });
        await page.waitForSelector('#block-bootstrap-business-content > div > article');
        await page.goto('http://digital.ga/node/add/noticia', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#edit-title-0-value');
        await page.type('#edit-title-0-value', data.titulo);
        let value = await getOptionValue(data.seccion);
        await page.select('#edit-field-seccion', value);
        let evalVar = data.cuerpo;
        await page.evaluate((evalVar) => {

            return document.querySelector('#edit-body-0-value').value = evalVar;
          
        }, evalVar);

       // await page.type('#edit-body-0-value', data.cuerpo, {delay: 10});

        await page.click('#edit-field-imagen-principal-selection-0-remove-button', { delay: 1000 });
        await page.waitForSelector('input.js-media-library-open-button');
        await page.click('input.js-media-library-open-button', { delay: 1000 });

        await page.waitForSelector('input[type=file]', {timeout: 5000});

        // get the ElementHandle of the selector above
        const inputUploadHandle = await page.$('input[type=file]');

        // prepare file to upload, I'm using test_to_upload.jpg file on same directory as this script
        // Photo by Ave Calvar Martinez from Pexels https://www.pexels.com/photo/lighthouse-3361704/
        //let fileToUpload = 'test_to_upload.jpg';

        // Sets the value of the file input to fileToUpload
        await inputUploadHandle.uploadFile(data.filename);
        await page.waitForSelector('input[data-drupal-selector=edit-media-0-fields-field-media-image-0-alt]');
        await page.waitForSelector('input[data-drupal-selector=edit-media-0-fields-field-media-image-0-alt]');


        await page.type('input[data-drupal-selector=edit-media-0-fields-field-media-image-0-alt]', 'La imagen original no tiene alt.');
        await page.waitForTimeout(2000);
        await page.waitForSelector('div.ui-dialog-buttonset.form-actions > button:nth-child(2)');
        await page.click('div.ui-dialog-buttonset.form-actions > button:nth-child(2)', {delay: 1000});
        await page.waitForTimeout(1000);

        //await page.click('button.button.button--primary.js-form-submit.form-submit');
        //await page.waitForTimeout(1000);

        let iter = 0;
        if (data.relacionados !== false) {
            let arr = data.relacionados;
            for (let item of arr) {
                await page.waitForTimeout(2000);
                let att = 'input[data-drupal-selector=edit-field-temas-relacionados-' + iter + '-target-id]';
                await page.waitForSelector(att);
                await page.type(att, item);
                await page.waitForTimeout(100);
                await page.focus('input[data-drupal-selector=edit-field-temas-relacionados-add-more]');
                await page.waitForSelector('input[data-drupal-selector=edit-field-temas-relacionados-add-more]');
                await page.click('input[data-drupal-selector=edit-field-temas-relacionados-add-more]', { delay: 1000 });
               
                iter++;
            }
        }



        await page.click('#edit-submit');
        await page.waitForTimeout('500');
        fs.unlink(data.filename, () => console.log('Imagen borrada'));
        //await page.evaluate();
        console.log('Una noticia fue cargada');
        await page.goto('http://digital.ga/user/logout');
        await page.waitForTimeout(500);
        //await browser.close();
        console.log(data);
        await page.close();
        await browser.close();
        return;

    } catch (e) {
        console.log(e);
    }

}

let getOptionValue = async (opt) => {
    opt = opt.toLowerCase();
    if (opt === 'archivo') return '11';
    if (opt === 'cultura') return '5';
    if (opt === 'deportes') return '1';
    if (opt === 'economia') return '2';
    if (opt === 'interés general') return '10';
    if (opt === 'judiciales') return '3';
    if (opt === 'locales') return '9';
    if (opt === 'nacionales') return '7';
    if (opt === 'opinión') return '6';
    if (opt === 'policiales') return '4';
    if (opt === 'provinciales') return '8';

    return '_none';
}

let createNews = async () => {
    console.log('Inicia buscar links');
    let links = await getter.getNewsLinks();
    links.sort();
    console.log('Inicia crear noticias');
    for (let iter = 0; iter < links.length; iter++) {
        await scrape(links[iter]);
    }
    console.log('termino')
}

async function setSelectVal(page, sel, val) {
        page.evaluate((data) => {
        return document.querySelector(data.sel).value = data.val
    }, {sel, val})
}
    
    
createNews();



// ERROR
//  No node found for selector: input[data-drupal-selector=edit-field-temas-relacionados-1-target-id]
