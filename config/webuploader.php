<?php
/*
* @Author: hzwlxy
* @Email: 120235331@qq.com
* @Github: http：//www.github.com/siaoynli
* @Date: 2019/7/16 14:17
* @Version:
* @Description:
*/

return [
    'route' => [
        "uri" => [
            "images" => "webuploader/images",
            "attaches" => "webuploader/attaches",
            "videos" => "webuploader/videos",
            "multi" => "webuploader/multi",
        ],
        "middleware" => []
    ],
    //filesystem disks name
    'disk' => 'public',
    //分片上传限制后缀
    "multi_ext" => [
        "mp4",
        "zip",
        "rar",
        "jpg"
    ],
    "multi_size" => 1024 * 1024 * 2000, //2g
];
