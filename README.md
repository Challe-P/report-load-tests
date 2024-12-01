# Load testing three popular API frameworks

> This is our last dance  
> This is ourselves  
> Under pressure

This report aims to test how three popular API frameworks in three different programming languages compare when load tested.

The frameworks I've chosen are [FastAPI](https://fastapi.tiangolo.com/), written in Python, [Express](https://expressjs.com/), written in JavaScript and [Laravel](https://laravel.com/), written in PHP.

The load testing will be done with [k6](https://k6.io/).

If you only want to run the tests and don't care how the servers are built, you can skip to the test section of this readme. The servers are published in Docker Images, and can be run with the commands:

```
$ docker compose up fastapi
$ docker compose up express
$ docker compose up laravel
```

The test can be run with the bash script (if the docker containers aren't running):

```
$ bash test.bash
```

## Creating the servers

The following section will briefly show how to set up the three different frameworks.

### FastAPI

This installation process follows this [guide](https://fastapi.tiangolo.com/#installation).

* Create a virtual environment for the server

```
# In the root directory of where you want your app to be
$ python -m venv .venv
```

* Activate the virtual environment

```
$ source .venv/bin/activate
```

* Create a [requirements.txt-file](/fast-api/requirements.txt)

It needs to have this content:
```
fastapi[standard]>=0.115.5
```

* Upgrade pip and install the requirements

```
$ python -m pip install --upgrade pip
$ pip install -r requirements.txt
```

* Create a [server file](/fast-api/main.py)

```
""" main.py """
from fastapi import FastAPI

app = FastAPI()

items = {1: "David Bowie", 2: "Queen"}

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id):
    return {items[int(item_id)]}
```

* Run the server

```
$ fastapi dev main.py
```

### Express

This installation process follows this [guide](https://expressjs.com/en/starter/installing.html).

* Create npm package
```
# In the root directory of where you want your app to be
$ npm init
# Set default for everything
```

* Install express

```
$ npm install express
```

* Create a server file 

```
// index.js
const express = require('express')
const app = express()
const port = 3000

items = {1: "David Bowie", 2: "Queen"}

app.get('/', (req, res) => {
  res.json({'Hello World!'})
})

app.get('/items/{item_id}', (req, res) => {
    res.json(items[items_id])
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

* Run the server

```
$ node index.js
```

### Laravel

This installation process follows this [guide](https://laravel.com/docs/11.x/routing)

* Make sure you have PHP and Composer installed

```
$ php --version
# your php version (needs to be at least 8.3)
$ composer --version 
# your composer version (at least 2.8)
```

* Create a laravel app

```
$ composer create-project laravel/laravel laravel 
# Last part is folder name, use something better than laravel when doing this yourself
```

* Install npm packages and build

```
$ cd laravel
$ npm install && npm run build
```

* Install Laravels API-plugin

```
$ php artisan install:api
```

* Create the routes in the [routes/api.php-file](/laravel/routes/api.php)

```
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function (Request $request) {
    return response()->json(["Message" => "Hello World!"]);
});

Route::get('/items/{id}', function(Request $request, string $id) {
    $items = [
        1 => "David Bowie",
        2 => "Queen",
    ];
    $id = intval($id);
    return response()->json([$items[$request->id]]);
});
```

* Build and run the server

```
$ npm run build
$ composer run dev 
```

## Package and run the servers in Docker Containers

To make sure the tests are *somewhat* replicable I've opted to build the servers into containers and run the tests on them from there.
See the Docker Files for more information on how they're built and run:
1. [FastAPI](/fast-api/Dockerfile)
2. [Express](/express/Dockerfile)
3. [Laravel](/laravel/Dockerfile)

They can be run with:

```
$ docker compose up fastapi
$ docker compose up express
$ docker compose up laravel
```

## Installing and setting up the load test application

This section follows this [guide](https://k6.io/blog/load-testing-restful-apis-with-k6/)

* Make sure you have k6 installed

```
$ k6 --version
```

If not, follow this guide: https://grafana.com/docs/k6/latest/set-up/install-k6/

* Make a test script

For more in depth about how k6 scripting works, read [this tutorial](https://k6.io/blog/load-testing-restful-apis-with-k6/)
The standard test script looks like this:
```
script.js

import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export default function () {
  const url = 'http://0.0.0.0:8000/';
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  check(http.get(url, params), {
    'status is 200': (r) => r.status == 200,
  }) || errorRate.add(1);
}
```

You run it with the command:
```
$ k6 run script.js
```

As you can see it tests the get function on the url specified. It looks like this when it's finished:

![Standard output of k6](/img/standard-output.png)

You can increase the number of calls, the number of virtual users (VU) and the duration of the tests with some flags:

```
k6 run -d 30s -u 15 ./load-test-script.js
```

For example runs the test for 30 seconds with 15 VUs.

The check part checks each request for the things you specify, in this script it only checks if the status code of the request is 200 (which means OK)

K6 is very powerful and has a lot of options and abilities. I highly recommend delving into it by reading the [docs](https://grafana.com/docs/k6/latest/) and doing some tests for your own.

### Visualising the results

If you want to visualize the data from k6 there are a lot of options. To keep things simple I've opted for using this tool: [K6 HTML Reporter](https://github.com/benc-uk/k6-reporter)


K6 HTML Reporter is very easy to set up, you don't even need to download it, just import it from GitHub and add an export function after your k6 script code.
```
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

# [...] script code

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
  };
}
```

This is what the previous test looks like in this HTML format:

![HTML output of k6 using K6 HTML Reporter](/img/html-output.png)

As specified in [k6s docs](https://grafana.com/docs/k6/latest/get-started/results-output/) you can output the data to a number of formats and use whatever graph-program you feel most comfortable with.

## Testing our APIs

To make a somewhat thorough test suite I've created one that tests to GET-requests, the root - which in all our servers is a message with hello world and one where we get an item from an array/dictionary. I've also included a POST route that adds to the array.

This is what the test script looks like:

```
// load-test-script-html-summary.js
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
```

To make things interesting I ran this script with an increasing amount of VUs until one of the servers started having trouble, then went down a notch. One problem with testing a server on the same computer as the test is that CPU is used both by the test and the server. This is why I test with 40 VUs, because I didn't want throttling to be an issue. I ran the tests for 60 seconds.

This is the [bash-script](test.bash) I ran:

```
# test.bash
#!/bin/bash

wait_for_container_to_stop() {
  local container=$1
  echo "Waiting for containern $container to stop..."
  while docker ps | grep -q "$container"; do
    sleep 1
  done
}

wait_for_container_to_start() {
  local container=$1
  echo "Waiting for containern $container to start..."
  until docker ps | grep -q "$container"; do
    sleep 1
  done
}

export SERVER="fastapi"
docker compose up -d fastapi
wait_for_container_to_start fastapi-server
sleep 5
k6 run -d 60s -u 40 ./load-test-script-html-summary.js
docker compose down fastapi
wait_for_container_to_stop fastapi

export SERVER="express"
docker compose up -d express
wait_for_container_to_start express-server
sleep 5
k6 run -d 60s -u 40 ./load-test-script-html-summary.js
docker compose down express
wait_for_container_to_stop express

export SERVER="laravel"
docker compose up -d laravel
wait_for_container_to_start laravel-server
sleep 5
k6 run -d 60s -u 40 ./load-test-script-html-summary.js
docker compose down laravel
wait_for_container_to_stop laravel
```

## Results and comparison

FastAPI results:

![FastAPI results](/img/fast-output.png)

Express results:

![Express results](/img/express-output.png)

Laravel results:

![Laravel results](/img/laravel-output.png)

The results are somewhat of a mixed bag. Laravel being the obviously worst contender of the three by only being able to process 6555 requests in the same amount of time, with a very high average response time (in milli-seconds) (83.60, 82.45 and 81.93).

FastAPI handles the most requests, 9444, but is a bit slower than Express, which handles the smaller number of 7200 requests. FastAPIs average speed: 12.22, 17.96 and 17.91. Express average speed: 7.52, 7.38 and 7.28.  

## Conclusion

Load testing is a good way to check if your server is handling everything as it should. I hope that you learned some basics about it from this report. As we saw in the tests result can differ a lot depending on what framework your code is written in, so take some time to choose and do a couple of tests. Load testing along the way is also a good way to find choke points where your code can be improved. Remember: You'll need to test all your endpoints to see if everything is working properly.


While performance is important, it's also important to choose a framework which works for you. Except maybe if Laravel works for you, then you'll need to find something faster. There's also other parameters this report doesn't cover, like extra features of the framework (I'm looking at you, [FastAPIs Interactive API docs](https://fastapi.tiangolo.com/#interactive-api-docs)). This is also an important factor to keep in mind when choosing your API framework. 

Good luck and keep on testing!
