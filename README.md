# laravel5 multipart upload

multipart upload for Laravel.


## 安装

```shell
$ composer require siaoynli/laravel-webupload
```

## 配置

1. 添加下面一行到 `config/app.php` 中 `providers` 部分：

   ```php
   Siaoynli\LaravelWebUpload\LaravelWebUploadServiceProvider::class
   ```

   

2.发布配置文件与资源,数据迁移

```php
php artisan vendor:publish --provider='Siaoynli\LaravelWebUpload\LaravelWebUploadServiceProvider'

php artisan migrate
```

3.输入http:://localhost/webuploader/demo 进行测试

4.中间件
```
"middleware" => ["web","auth"]
```

# 说明

```
依赖:siaoynli/laravel-uploads https://github.com/siaoynli/laravel-uploads      
 siaoynli/laravel-images https://github.com/siaoynli/laravel-images 

分片上传文件默认存放到storage/app/upload/files目录

也可以指定disk 名字，直接都上传到指定disk目录

普通上传根据 config/upload.php 配置来配置，添加水印，裁剪图片等

其他个性化配置，请查看源码，更改config相应的上传连接，如使用自己的上传方法等
```

# License

MIT
