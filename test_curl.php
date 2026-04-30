<?php $json = file_get_contents('https://query2.finance.yahoo.com/v1/finance/search?q=market&newsCount=1'); $data = json_decode($json, true); echo $data['news'][0]['link'];
