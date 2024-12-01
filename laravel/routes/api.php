<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::get('/', function (Request $request) {
    return response()->json(["Message" => "Hello World!"]);
});

Route::get('/items/{id}', function(Request $request, string $id) {
    $items = [
            "1" => "David Bowie",
            "2" => "Queen",
        ];
    return response()->json(["item" => $items[$id]]);
});

Route::post('/items', function(Request $request) {
    $items = [
        "1" => "David Bowie",
        "2" => "Queen",
    ];
    array_push($items, [$request['index'] => $request['name']]);
    return response()->json([$items], 201);
});
