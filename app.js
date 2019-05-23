/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// [START gae_node_request_example]
const express = require('express');
var Twitter = require('twitter');
// Imports the Google Cloud client library
const {Datastore} = require('@google-cloud/datastore');

const app = express();

function twodigit(n){
  return n > 9 ? "" + n: "0" + n;
}

(async () => {
  let token = await getTwitterAPIKey()
  var client = new Twitter({
    consumer_key: token['consumer_key'],
    consumer_secret: token['consumer_secret'],
    access_token_key: token['access_token_key'],
    access_token_secret: token['access_token_secret']
  });
  var stream = client.stream('statuses/filter', {track: '#tradewar'});
  stream.on('data', function(event) {
    var time = new Date()
    var timestr = `${twodigit(time.getDate())}/${twodigit(time.getMonth()+1)} ${twodigit(time.getHours())}:00`
    console.log(`${timestr} ${event.text}`)
    update(timestr, 1)
  });
  stream.on('error', function(error) {
    throw error
  });

  get()

})()

var dbmap = {}

var a = 0

var tradewar = []
var times = []

function findTime(t) {
  for(var i = 0; i<times.length; i++) {
    if(times[i] === t) return i
  }
  return -1
}

function strtime() {
  var str = '['
  for(var i = 0; i<times.length; i++) {
    str += `'${times[i]}'`
    if(i != times.length - 1) {
      str += ','
    }
  }
  str += ']'
  return str
}

app.get('/', (req, res) => {
  res
    .status(200)
    .send(`
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>#tradewar Data Analysis</title>
</head>
<style>
    .container {
        width: 75%;
        height: 75%;
    }
</style>
<body>
    <h1>#tradewar Data Analysis</h1>
    <div class="container">
        <canvas id="myChart"></canvas>
    </div>

</body>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.js"></script>
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
<script>function renderChart(data, labels) {
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '#tradewar',
                data: data,
            }]
        },
    });
}


data = [${tradewar}];
labels =  ${strtime()};
renderChart(data, labels);

</script>

</html>
    `)
    .end();
});



// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_node_request_example]


async function getTwitterAPIKey() {
  // Your Google Cloud Platform project ID
  const projectId = 'wsp-final';

  // Creates a client
  const datastore = new Datastore({
    projectId: projectId,
  });
  var apiMap = {}
  const query = datastore.createQuery('Twitter');
  const [tasks] = await datastore.runQuery(query);
  tasks.forEach(task => {
    const taskKey = task[datastore.KEY];
    apiMap[taskKey.name] = task.description
  });
  return apiMap
}

async function update(t, n) {
  // Your Google Cloud Platform project ID
  const projectId = 'wsp-final';

  // Creates a client
  const datastore = new Datastore({
    projectId: projectId,
  });
  var apiMap = {}
  const query = datastore.createQuery('Tradewar');
  const [tasks] = await datastore.runQuery(query);
  tasks.forEach(task => {
    const taskKey = task[datastore.KEY];
    apiMap[taskKey.name] = task.description
  });

  var num = 0
  if (!isNaN(apiMap[t])) {
    num = Number(apiMap[t])
  }

  num += n

  var numStr = String(num)
  const kind = 'Tradewar';
  // The name/ID for the new entity
  const name = t;
  // The Cloud Datastore key for the new entity
  const taskKey = datastore.key([kind, name]);

  // Prepares the new entity
  const task = {
    key: taskKey,
    data: {
      description: numStr,
    },
  };

  await datastore.save(task);
}

async function get() {
// Your Google Cloud Platform project ID
  const projectId = 'wsp-final';

  // Creates a client
  const datastore = new Datastore({
    projectId: projectId,
  });
  const query = datastore.createQuery('Tradewar');
  const [tasks] = await datastore.runQuery(query);
  tasks.forEach(task => {
    const taskKey = task[datastore.KEY];
    // apiMap[taskKey.name] = task.description
    // var timestr = `${Math.floor(Math.random() * 4) + 13}:00`
    var i = findTime(taskKey.name)
    if(i === -1) {
      tradewar.push(Number(task.description));
      times.push(taskKey.name);
    } else {
      tradewar[i] = Number(task.description)
    }
  });

  console.log('=>', times, tradewar)
}

setInterval(get, 15* 1000)

