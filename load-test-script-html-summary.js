import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const listErrorRate = new Rate('Root_errors');
const itemErrorRate = new Rate('Item_errors');
const createErrorRate = new Rate('Create_item_error');
const RootTrend = new Trend('Show_root');
const ItemTrend = new Trend('Show_item_one')
const CreateTrend = new Trend('Create_item');

export const options = {
    thresholds: {
        'Show_root': ['p(95)<500'],
        'Show_item_one': ['p(95)<500'],
    },
};

export default function () {
    // .env to say which server we are testing
    const server = __ENV.SERVER;
    const urls = {
        fastapi: {
            root: 'http://0.0.0.0:8000',
            itemOne: 'http://0.0.0.0:8000/items/1',
            create: 'http://0.0.0.0:8000/items/'
        },
        express: {
            root: 'http://0.0.0.0:8001',
            itemOne: 'http://0.0.0.0:8001/items/1',
            create: 'http://0.0.0.0:8001/items/'
        },
        laravel: {
            root: 'http://0.0.0.0:8002/api',
            itemOne: 'http://0.0.0.0:8002/api/items/1',
            create: 'http://0.0.0.0:8002/api/items/'
        }
    };

    const urlRoot = urls[server].root;
    const urlItemOne = urls[server].itemOne;
    const urlCreate = urls[server].create;

    const params = {
        headers: {
        'Content-Type': 'application/json',
        },
    };

    // Data for the POST request
    const createItemData = JSON.stringify({
        index: "3",
        name: `Under pressure`,
    });

    const requests = {
        'Get root': {
            method: 'GET',
            url: urlRoot,
            params: params
        },
        'Get item one': {
            method: 'GET',
            url: urlItemOne,
            params: params
        },
        'Create item': {
            method: 'POST',
            url: urlCreate,
            params: params,
            body: createItemData
        }
    };

    const responses = http.batch(requests);
    const rootResp = responses['Get root'];
    const itemResp = responses['Get item one'];
    const createResp = responses['Create item'];

    check(rootResp, {
        'status is 200': (r) => r.status === 200,
    }) || listErrorRate.add(1);

    RootTrend.add(rootResp.timings.duration);

    check(itemResp, {
        'status is 200': (r) => r.status === 200,
        'item is David Bowie': (r) => r.json('item') === "David Bowie"
    }) || itemErrorRate.add(1);


    ItemTrend.add(itemResp.timings.duration)

    check(createResp, {
        'status is 201': (r) => r.status === 201,
    }) || createErrorRate.add(1);

    CreateTrend.add(createResp.timings.duration);
    
    sleep(1);
}

export function handleSummary(data) {
    const filename = __ENV.SERVER + "-summary.html"
    return {
        [filename]: htmlReport(data),
    };
}
