<?php
/*
* @Author: hzwlxy
* @Email: 120235331@qq.com
* @Github: http：//www.github.com/siaoynli
* @Date: 2019/7/30 16:13
* @Version:
* @Description:
*/

namespace Siaoynli\LaravelWebUpload\Services;

use Illuminate\Support\Facades\Schema;
use Siaoynli\LaravelWebUpload\Models\File;
use Illuminate\Support\Facades\Storage;
use Exception;

class WebuploaderService
{
    //方便临时文件排序
    private $chunkNum = 1000000000;
    private $config;
    private $disk = "local";



    public function __construct()
    {
        $this->config = config("webuploader");
        $this->disk = $this->config['disk'];
        try {
            $this->root = config("filesystems")["disks"][$this->disk]['root'];
        } catch (Exception $e) {
            throw  new Exception("请设置filesystems.php disk:" . $this->disk);
        }
    }

    public function checkFile()
    {
        $data = request()->all();
        $original_name = request()->get("name", "");
        $size = request()->get("size", "");

        if (!Schema::hasTable('files')) {
            return ["exist" => 0];
        }

        $file = File::where("hash", $data["hash"])->first();
        if (!$file) return ["exist" => 0];

        //文件不存在
        if (!Storage::disk($this->disk)->exists($file->path)) {
            File::where("hash", $data["hash"])->delete();
            return ["exist" => 0];
        }

        //获取头信息失败
        try {
            $mimetype = Storage::disk($this->disk)->mimeType($file->path);
        } catch (\Exception $e) {
            $mimetype = "";
        }

        $arr = explode(".", $file->path);

        return [
            "exist" => 1,
            "state" => "SUCCESS",
            "url" => $file->path,
            "disk_name" => $file->disk_name,
            'original_name' => $original_name,
            'ext' => end($arr),
            'mime' => $mimetype,
            'size' => $size,
        ];
    }


    public function chunkCheck()
    {

        $dir_name = request()->get('hash', "");
        $chunkIndex = request()->get('chunk_index', 0);
        $size = request()->get('size', 0);

        if (!is_dir(storage_path('app/multipart_upload/' . $dir_name))) {
            Storage::disk('local')->makeDirectory('multipart_upload/' . $dir_name);
        }

        $chunk_file = storage_path('app/multipart_upload/' . $dir_name . '/' . ($this->chunkNum + $chunkIndex));
        //简单校验分片文件，不严谨
        if (file_exists($chunk_file)) {
            if (filesize($chunk_file) == $size) {
                return ['exist' => 1];
            }
        }
        return ['exist' => 0];
    }


    public function chunkUpload()
    {

        $file = request()->file("file");
        $chunk = request()->get('chunk');
        $chunks = request()->get('chunks');
        $uniqueFileName = request()->get('hash');

        if (!$file) {
            return ['state' => '上传失败'];
        }

        if ($file->isValid()) {
            $ext = strtolower($file->getClientOriginalExtension());

            if (!in_array($ext, config("webuploader.multi_ext"))) {
                Storage::disk('local')->deleteDirectory('multipart_upload/' . $uniqueFileName);
                return ['state' => '不允许上传的类型'];
            }

            if ($file->getSize() > config("webuploader.multi_size")) {
                Storage::disk('local')->deleteDirectory('multipart_upload/' . $uniqueFileName);
                return ['state' => '上传文件大小超过限制'];
            }
            $original_name = $file->getClientOriginalName();

            $realPath = $file->getRealPath();
            $dir_name = 'multipart_upload/' . $uniqueFileName;

            if (!is_dir(storage_path($dir_name))) {
                Storage::disk('local')->makeDirectory($dir_name);
            }

            Storage::disk('local')->put($dir_name . '/' . ($this->chunkNum + $chunk), file_get_contents($realPath));
            if ($chunks == ($chunk + 1)) {
                return ['chunked' => true, 'state' => 'SUCCESS', 'ext' => $ext, 'original' => $original_name];
            } else {
                return ['chunked' => true, 'state' => 'SUCCESS'];
            }
        } else {
            return ['chunked' => false, 'state' => '文件上传失败'];
        }
    }

    public function chunksMerge()
    {



        $store = request()->all();
        $ext = strtolower($store['ext']);
        $dir_name = $store['hash'];
        $chunks = $store['chunks'];

        $original_name = $store['original_name'];

        $path = '/uploads/files/' . date('Y-m-d');

        if (!is_dir(storage_path('app/' . $path))) {
            Storage::makeDirectory($path);
        }

        $filename = $path . '/' . md5(uniqid()) . '.' . $ext;
        $files = Storage::disk('local')->files('multipart_upload/' . $dir_name);

        if (count($files) == 0) {
            return [
                'state' => '上传失败',
            ];
        }

        if (count($files) == $chunks) {
            sort($files);

            $fp = fopen(storage_path('app/') . $filename, "ab");

            foreach ($files as $file) {
                $tempFile = storage_path('app/' . $file);
                $handle = fopen($tempFile, "rb");
                fwrite($fp, fread($handle, filesize($tempFile)));
                fclose($handle);
                unset($handle);
            }
            fclose($fp);
            Storage::disk('local')->deleteDirectory('multipart_upload/' . $dir_name);

            $mimetype = Storage::disk('local')->mimeType($filename);
            $size = Storage::disk('local')->size($filename);

            if ($this->disk != "local") {
                if (!is_dir($this->root . '/' . dirname($filename))) {
                    Storage::disk($this->disk)->makeDirectory($this->root . '/' . dirname($filename));
                }
                Storage::disk($this->disk)->put($filename, Storage::disk('local')->get($filename));
                Storage::disk('local')->delete($filename);
            }

            if (Schema::hasTable('files')) {
                //写入表
                $data["hash"] = $store['hash'];
                $data["path"] = $filename;
                $data["disk_name"] = $this->disk;
                File::firstOrCreate($data);
            }
            return [
                'state' => 'SUCCESS',
                'original_name' => $original_name,
                'ext' => $ext,
                'disk_name' => $this->disk,
                'mime' => $mimetype,
                'size' => $size,
                'url' => $filename,  //文件存放路径
            ];
        }

        return [
            'state' => '上传失败[文件分片对比错误]',
        ];
    }
}
