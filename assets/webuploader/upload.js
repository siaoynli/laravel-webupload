var Upload = (function () {
  var ELEM = ".upload-container";

  var ratio = window.devicePixelRatio || 1,
    thumbSize = 100 * ratio;

  var _options = {
    // 选完文件后，是否自动上传。
    auto: false,
    // swf文件路径
    swf: BASE_URL + "/Uploader.swf",
    //指定运行时启动顺序。默认会想尝试 html5 是否支持，如果支持则使用 html5, 否则则使用 flash.
    runtimeOrder: "html5,flash",
    //设置文件上传域的name
    fileVal: "file",
    //是否允许在文件传输时提前把下一个文件准备好
    prepareNextFile: true,
    //压缩
    compress: false,
    threads: 10,
    fileNumLimit: 10,
    fileSizeLimit: 1024 * 1024 * 100, //100m
    //去重， 根据文件名字、文件大小和最后修改时间来生成hash Key.
    duplicate: true,
    accept: {
      title: "Images",
      extensions: "gif,jpg,jpeg,bmp,png,zip",
      mimeTypes: "image/*"
    }
  };

  function initCreate (chooseBtn, options) {
    options.pick.id = chooseBtn;
    Object.assign(_options, options);
    return WebUploader.create(_options);
  }

  function uploadEvent (uploader, obj, callback) {
    var $list = obj.parents(ELEM).find(".item-list");
    var btn = obj.parents(ELEM).find("button");

    btn.on("click", function () {
      if (btn.hasClass("disabled")) {
        return;
      }
      if ($(this).hasClass("stop")) {
        uploader.stop(true);
        $(this).removeClass("stop");
        btn.html("继续上传");
      } else {
        uploader.upload();
        btn.html("暂停");
      }
    });

    //加入队列
    uploader.onFileQueued = function (file) {
      //已经上传之后，不能再添加

      if (obj.find(".webuploader-pick").hasClass("disabled")) {
        toastr.warning("请等待上传完成!");
        return;
      }

      var $li = $(
        '<div id="' +
        file.id +
        '" class="file-item" style="width:' +
        thumbSize +
        "px;height:" +
        thumbSize +
        'px">' +
        '<img alt=""><p class="upload-state" ><i class="iconfont icon-cloud-upload"></i></p>' +
        "</div>"
      ),
        $img = $li.find("img");
      // $list为容器jQuery实例
      $list.append($li);
      // 创建缩略图
      // 如果为非图片文件，可以不用调用此方法。
      // thumbnailWidth x thumbnailHeight 为 100 x 100
      this.makeThumb(
        file,
        function (error, src) {
          if (error) {
            $img.replaceWith(
              '<div class="item-cover"><i class="iconfont icon-file-unknown"></i></div>'
            );
            return;
          }
          $img.attr("src", src);
        },
        thumbSize,
        thumbSize
      );
    };

    //一堆文件加入队列
    uploader.onFilesQueued = function (files) {
      //todo...
    };

    //当文件被移除队列后触发
    uploader.onFileDequeued = function (file) { };

    //上传之前
    uploader.onBeforeFileQueued = function (file) {
      //移除上传禁止样式
      btn.removeClass("disabled");
      if (!this.options.pick.multiple) {
        var $files = this.getFiles();

        if ($files.length > 0) {
          //提示信息
          toastr.error("请等待上一个传输完毕");
          return false;
        }
        $list.children().remove();
      }
    };

    //当开始上传流程时触发
    uploader.onStartUpload = function () {
      obj.find(".webuploader-pick").addClass("disabled");
      if (btn && !btn.hasClass("disabled")) {
        btn.html("暂停");
        btn.addClass("stop");
      }
    };

    //暂停
    uploader.onStopUpload = function () { };

    //上传进度
    uploader.onUploadProgress = function (file, percentage) {
      var $li = $("#" + file.id),
        $percent = $li.find(".progress .progress-bar");
      // 避免重复创建
      if (!$percent.length) {
        $percent = $(
          '<div class="progress progress-striped active">' +
          '<div class="progress-bar" role="progressbar" style="width: 0%">' +
          "</div>" +
          "</div>"
        )
          .appendTo($li)
          .find(".progress-bar");
      }
      $li
        .find("p.upload-state")
        .attr("title", "正在上传")
        .html(parseInt(percentage * 100) + "%");
      $percent.css("width", percentage * 100 + "%");
    };

    //上传成功
    uploader.onUploadSuccess = function (file, response) {
      //服务器端返回的上传
      var $obj = $("#" + file.id);

      var $item = $obj.find("p.upload-state");
      if (response.state === "SUCCESS") {
        $item.attr("title", "上传成功");
        $item
          .removeClass("upload-state-error")
          .html('<i class="iconfont icon-check"></i>');
      } else {
        $item.attr("title", response.state);
        var $error = $obj.find("p.upload-state-error");
        if (!$error.length) {
          $item
            .addClass("upload-state-error")
            .html('<i class="iconfont icon-close"></i>');
        }
      }

      callback(file, response);
    };

    //上传失败
    uploader.onUploadError = function (file) {
      var $obj = $("#" + file.id);
      var $item = $obj.find("p.upload-state");
      var $error = $obj.find("p.upload-state-error");
      toastr.error("上传失败");
      if (!$error.length) {
        $item
          .addClass("upload-state-error")
          .html('<i class="iconfont icon-close"></i>');
      }
    };

    //不管成功或者失败，文件上传完成时触发
    uploader.onUploadComplete = function (file) {
      $("#" + file.id)
        .find(".progress")
        .fadeOut();
    };

    //所有文件上传结束
    uploader.onUploadFinished = function () {
      if (btn) {
        btn.html("开始上传");
        btn.removeClass("stop");
        btn.addClass("disabled");
      }
      obj.find(".webuploader-pick").removeClass("disabled");
      uploader.reset();
    };

    uploader.onError = function (type, handler) {
      console.log(type);
      if (type === "Q_TYPE_DENIED") {
        //提示信息
        toastr.error("上传类型不允许");
      } else if (type === "F_EXCEED_SIZE") {
        //提示信息
        toastr.error("上传文件超过限制大小");
      } else if (type === "Q_EXCEED_SIZE_LIMIT") {
        //提示信息
        toastr.error("上传文件超过限制大小");
      }
    };
  }

  return {
    upload: function (options, picker, callback) {
      var _this = $(ELEM).find(picker);
      if (_this.length > 1) {
        console.error("上传实例有多个相同的class:" + picker);
      }
      uploadEvent(initCreate(_this, options), _this, callback);
    }
  };
})();
