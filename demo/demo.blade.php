<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>上传和分片上传实例</title>
    <script src="https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
    @include('vendor.webuploader.assets')
</head>

<body>

    <div class="container">
        <div class="upload-container">
            <div class="item-list"></div>
            <div class="upload-btns-group">
                <div class="btn-file-picker">选择文件</div>
                <button class="disabled">开始上传</button>
            </div>
        </div>

        <div class="mulitpart-upload-container">
            <div class="item-list"></div>
            <div class="upload-btns-group">
                <div class="btn-file-picker2">选择文件</div>
                <button class="disabled">分片上传</button>
            </div>
        </div>

    </div>

</body>

</html>

<script>
    $(function () {
        var options = {
            auto: false,
            server:  '{{ url(config("webuploader.route.uri.images")) }}',
            pick: {
                multiple: true,
            },
            formData: {_token:"{{ csrf_token() }}"},
            accept: {
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }
        };

        //上传成功后的回调，比如dom操作，地址写入隐藏表单
        Upload.upload(options,'.btn-file-picker', function (file, response) {
            console.log(file);
                console.log(response);

                if(response.state==="SUCCESS") {
                    toastr.success('上传成功');
                    $("#" + file.id).remove();
                }else{
                    toastr.error(response.state);
                }
        });


        var options2 = {
            auto: false,
            server:  '{{ url(config("webuploader.route.uri.multi")) }}',
            pick: {
                multiple: true,
            },
            formData: {_token:"{{ csrf_token() }}"},
            accept: {
                title: 'Images',
                 extensions: 'gif,jpg,jpeg,bmp,png',
                 mimeTypes: 'images/*'
            }
        };

        //上传后的回调，比如dom操作，地址写入隐藏表单
        MultiUpload.upload(options2,".btn-file-picker2", function (file, response) {
                console.log(file);
                console.log(response);

                if(response.state==="SUCCESS") {
                    toastr.success('上传成功');
                    $("#" + file.id).remove();
                }else{
                    toastr.error(response.state);
                }

        });


    })
</script>
