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
        //["web","auth"]
        "middleware" => []
    ],
    //filesystem disks name ,如果为空，则上传到public目录
    'disk' => '',
    //分片上传限制后缀
    "extensions" => [
        "images" => [
            "jpg",
            "jpeg",
            "png",
            "bmp",
            "gif"
        ],
        "videos" => [
            "mp4",
            "flv",
            "mkv",
            "avi"
        ],
        "attaches" => [
            "zip",
            "rar",
            "doc",
            "txt",
            "pdf",
            "docx",
            "xls",
            "xlsx",
            "xlt",
        ],
    ],
    "multi_size" => 1024 * 1024 * 2000, //2g
    'multi_disk' => 'local',
];
