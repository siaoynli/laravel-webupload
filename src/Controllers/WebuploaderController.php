<?php
/*
* @Author: hzwlxy
* @Email: 120235331@qq.com
* @Github: http：//www.github.com/siaoynli
* @Date: 2019/7/30 11:28
* @Version:
* @Description:
*/

namespace Siaoynli\LaravelWebUpload\Controllers;


use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Siaoynli\LaravelWebUpload\Services\WebuploaderService;
use  Siaoynli\Upload\Facades\Upload;
use  Siaoynli\Image\Facades\Image;

class  WebuploaderController extends Controller
{
    private $disk = "";

    public function __construct()
    {
        $this->config = config("webuploader");
        $this->disk = $this->config['disk'];

    }

    public function demo()
    {

        return view("demo");
    }

    public function images()
    {
        $info = Upload::disk($this->disk)->do();
        $filename = $info["url"];
        //如果是上传到public目录则压缩图片
        if (!$this->disk) {
            Image::file("." . $filename)->resize()->save();
        }
        return $info;
    }

    public function attaches()
    {
        $info = Upload::disk($this->disk)->type("attach")->do();
        return $info;
    }

    public function videos()
    {
        $info = Upload::disk($this->disk)->type("video")->do();
        return $info;
    }


    public function multi(Request $request, WebuploaderService $service)
    {
        if ($request->isMethod('post')) {
            $action = request()->get('option');
            switch ($action) {
                case "hashCheck":
                    return $service->checkFile();
                case "chunkCheck":
                    return $service->chunkCheck();
                    break;
                case "chunksMerge":
                    return $service->chunksMerge();
                    break;
                default:
                    return $service->chunkUpload();
                    break;
            }
        }
    }
}
