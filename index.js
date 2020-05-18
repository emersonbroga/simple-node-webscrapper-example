const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://gamefaqs.gamespot.com';

const browserHeaders = {
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9,pt;q=0.8',
  'cache-control': 'max-age=0',
  cookie:
    'gf_dvi=ZjVlYzI2MDI5MDAwMDk4MDJhYmNlMmEzNWQ5Yzk4NmQ1Y2I0OGQ5MWRiMjMyOGVlOGM4ZGRhZjEyYjQ4NWVjMjYwMjk%3D; gf_geo=ODIuMTAyLjE5LjEyNjo1Njow; fv20200519=1; dfpsess=p; spt=no; OptanonAlertBoxClosed=2020-05-18T10:15:11.964Z; __utma=132345752.1445946617.1589796912.1589796912.1589796912.1; __utmb=132345752.0.10.1589796912; __utmc=132345752; __utmz=132345752.1589796912.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); XCLGFbrowser=WwJscV7CYDDEbpcd5eE; LDCLGFbrowser=cf25558c-28fa-4640-971d-f748ad6480c6; s_vnum=1592388912352%26vn%3D1; s_invisit=true; s_lv_gamefaqs_s=First%20Visit; AMCVS_10D31225525FF5790A490D4D%40AdobeOrg=1; s_ecid=MCMID%7C38512240192690932273707304770506682855; s_cc=true; AMCV_10D31225525FF5790A490D4D%40AdobeOrg=1585540135%7CMCIDTS%7C18401%7CvVersion%7C4.4.0%7CMCMID%7C38512240192690932273707304770506682855%7CMCAAMLH-1590401714%7C6%7CMCAAMB-1590401714%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1589804116s%7CNONE%7CMCAID%7CNONE; aam_uuid=38296794275852620993685480490082677919; __gads=ID=25c561d79a96e764:T=1589796917:S=ALNI_MZ3_k27Rjrs7d713Cg0Bcf0qFlqxw; QSI_SI_cRMGrRyFByec7it_intercept=true; s_sq=%5B%5BB%5D%5D; OX_plg=pm; QSI_HistorySession=https%3A%2F%2Fgamefaqs.gamespot.com%2Fn64%2Fcategory%2F999-all~1589796941166%7Chttps%3A%2F%2Fgamefaqs.gamespot.com%2Fn64%2Fcategory%2F999-all%3Fpage%3D1~1589797341231; OptanonConsent=isIABGlobal=false&datestamp=Mon+May+18+2020+07%3A25%3A05+GMT-0300+(Brasilia+Standard+Time)&version=6.0.0&landingPath=NotLandingPage&groups=1%3A1%2C2%3A1%2C3%3A1%2C4%3A1%2C5%3A1&hosts=&legInt=&consentId=45bfbff9-a24e-4e7f-8785-37c76e8c339f&interactionCount=1&geolocation=BE%3BBRU&AwaitingReconsent=false; s_getNewRepeat=1589797505552-New; s_lv_gamefaqs=1589797505553; RT="sl=10&ss=1589796905591&tt=42393&obo=0&bcn=%2F%2F173e2529.akstat.io%2F&sh=1589797508565%3D10%3A0%3A42393%2C1589797482409%3D9%3A0%3A38639%2C1589797477541%3D8%3A0%3A34483%2C1589797339453%3D7%3A0%3A20511%2C1589796939175%3D6%3A0%3A12745&dm=gamefaqs.gamespot.com&si=34110a25-e405-46bc-8514-539dd6005a62&ld=1589797508565&r=https%3A%2F%2Fgamefaqs.gamespot.com%2Fn64%2Fcategory%2F999-all%3Fpage%3D1&ul=1589797692763"',
  referer: 'https://gamefaqs.gamespot.com/',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
};

const slug = (str) => {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  var to = 'aaaaeeeeiiiioooouuuunc------';
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
};

const writeToFile = (data, filename) => {
  const promiseCallback = (resolve, reject) => {
    fs.writeFile(filename, data, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(true);
    });
  };
  return new Promise(promiseCallback);
};

const readFromFile = (filename) => {
  const promiseCallback = (resolve) => {
    fs.readFile(filename, 'utf8', (error, contents) => {
      if (error) {
        resolve(null);
      }
      resolve(contents);
    });
  };
  return new Promise(promiseCallback);
};

const getPage = (path) => {
  const url = `${BASE_URL}${path}`;
  const options = {
    headers: browserHeaders,
  };
  return axios.get(url, options).then((response) => response.data);
};

const getCachedPage = (path) => {
  const filename = `cache/${slug(path)}.html`;
  const promiseCallback = async (resolve, reject) => {
    const cachedHTML = await readFromFile(filename);
    if (!cachedHTML) {
      const html = await getPage(path);
      await writeToFile(html, filename);
      resolve(html);
      return;
    }
    resolve(cachedHTML);
  };

  return new Promise(promiseCallback);
};

const saveData = (data, path) => {
  const promiseCallback = async (resolve, reject) => {
    if (!data || data.length === 0) return resolve(true);
    const dataToStore = JSON.stringify({ data: data }, null, 2);
    const created = await writeToFile(dataToStore, path);
    resolve(true);
  };

  return new Promise(promiseCallback);
};

const getPageItems = (html) => {
  const $ = cheerio.load(html);
  const promiseCallback = (resolve, reject) => {
    const selector = '#content > div.post_content.row > div > div:nth-child(1) > div.body > table > tbody > tr';

    const games = [];
    $(selector).each((i, element) => {
      const a = $('td.rtitle > a', element);
      const title = a.text();
      const href = a.attr('href');
      const id = href.split('/').pop();
      games.push({ id, title, path: href });
    });

    resolve(games);
  };

  return new Promise(promiseCallback);
};

const getAllPages = async (start, finish) => {
  let page = start;
  do {
    const path = `/n64/category/999-all?page=${page}`;
    await getCachedPage(path)
      .then(getPageItems)
      .then((data) => saveData(data, `./db/db-${page}.json`))
      .then(console.log)
      .catch(console.error);
    page++;
  } while (page < finish);
};

getAllPages(0, 10);
