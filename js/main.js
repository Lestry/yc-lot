(function(global, doc, $) {
  // 缓存抽奖数据的LS KEY
  const CACHE_KEY = 'tj_lot_data_cache';
  // 全局使用的抽奖数据
  let data = null;
  // 全局使用的timer
  let lotScrollTimer = 0;
  
  // 保存抽奖数据到缓存
  function saveLotData() {
    if (data) {
      const objData = JSON.stringify(data);
      localStorage.setItem(CACHE_KEY, objData);
    } else {
      throw new Error('Data 错误');
    }
  }

  // 从缓存读取抽奖数据
  function getLotData() {
    const objData = localStorage.getItem(CACHE_KEY);
    if (objData !== null) {
      try {
        return (JSON.parse(objData));
      } catch (e) {
        throw new Error(e);
      }
    }
    return null;
  }

  // 加载数据
  function loadData() {
    // 读取缓存数据
    let _data = getLotData() || { pool: {}, loted: [] };
    // 进行数据异常处理
    if (_.keys(_data.pool).length === 0) {
      _data.pool = _.cloneDeep(global.TJ_2020_BASE_DATA);
      _data.loted = [];
    }
    // 开始按钮初始化
    $('#btn-lot')
      .prop('disabled', false)
      .attr('class', 'play');
    // 清空结果面板
    $('#board').html('');
    
    return _data;
  }

  // 更新数据
  function updateData() {
    // 缓存数据
    saveLotData();
    // 更新结果面板
    const results = _.values(data.loted);
    if (results.length > 0) {
      $('#result-panel').html(results.map(function(item, i) {
        return Array.isArray(item) ? `<div class="result-row">
          <span class="result-title">第${i + 1}轮（${item.length}）:</span>
          <span class="result-content">${item.map(t => `<span>${t.number}(${t.name}:${t.account})</span>`).join('、')}</span>
        </div>` : '';
      }).join(''));
    }
    // 更新已抽和剩余
    const haslot = _.flatten(data.loted);
    const unlot = _.flatten(_.values(data.pool));
    $('#number-done').html(haslot.length);
    $('#number-left').html(unlot.length);
    // 更新总数
    $('#total-num').html(haslot.length + unlot.length);
  }

  // 获取抽奖模式 0-抽组 1-抽人 2-抽人(无分组)
  function getLotType() {
    const type = $('#lot-type-container > input[type="radio"]:checked').val() || 0;

    return Number.isNaN(+type) ? 0 : +type;
  }

  // 填充锦鲤池
  function pushToBoard({ number, name, account }) {
    // children最大不可超过20个 
    if ($('#board').children().length < 20) {
      $('#board').append(`<span class="board-num left-in" title="${name}（${account}）">${number}</span>`)
      return true;
    }
    return false;
  }

  // 开始-结束滚动
  function toggleLotScroll(type, start) {
    clearInterval(lotScrollTimer);
    if (type === 0) {
      $('#lucky-group-text').html('?');

      lotScrollTimer = start ? setInterval(function() {
        const letters = 'ABCDEFGH';
        const num = Math.floor(Math.random() * letters.length);
        $('#lucky-group-text').html(letters.charAt(num));
      }, 15) : 0;
    } else {
      $('#lucky-number-text').html('???');
      
      lotScrollTimer = start ? setInterval(function() {
        let num = Math.ceil(Math.random() * 999);
        num = num < 10 ? `00${num}` : (num < 100 ? `0${num}` : num);
        $('#lucky-number-text').html(num);
      }, 15) : 0;
    }
  }

  // 号码滚动停止
  function stopLot(type, num) {
    // 定义停止方法
    const stopFunc = function() {
      // 停止数字滚动
      toggleLotScroll(type, false);
      // 恢复play按钮
      $('#btn-lot').prop('disabled', false);
    };

    if (type === 0) {
      // 抽组的情况
      const groupPool = _.filter(_.keys(data.pool), function(groupKey) {
        return _.get(data.pool, `${groupKey}.length`) > 0;
      });

      stopFunc();

      if (groupPool.length > 0) {
        const currGroup = groupPool[Math.floor(Math.random() * groupPool.length)];
        console.log(groupPool)
        $('#lucky-group-text').html(currGroup);
      }
    } else {
      // 抽人的情况
      let tempPool = [];
      const curr = [];
      
      if (type === 2) {
        tempPool = _.flatten(_.values(data.pool));
      } else {
        tempPool = _.get(data.pool, $('#lucky-group-text').html()) || [];
      }

      // 如果tempPool有效 则继续
      if (Array.isArray(tempPool) && tempPool.length > 0) {
        // 如果实际池子不足抽取设定 可取池子数
        const realNum = Math.min(tempPool.length, num);
        for (let i = 0; i < realNum; i++) {
          curr.push(tempPool.splice(Math.floor(Math.random() * tempPool.length), 1)[0]);
        }
      }
      // 更新data中的已抽数据
      data.loted.push(curr.slice());
      // 如果是模式2（无分组直接抽的情况）还需要对原始池子进行数据更新
      if (type === 2 && curr.length > 0) {
        const currNums = curr.map(function(c) {
          return c.number;
        });

        _.keys(data.pool).forEach(function(group) {
          if (data.pool && data.pool[group]) {
            data.pool[group] = _.filter(data.pool[group], function(p) {
              // 每个组仅保留未抽中的
              return currNums.indexOf(p.number) === -1;
            });
          }
        });
      }
      // 只有抽了人才需要更新数据
      updateData();
      // 定义递归方法
      const setNum = function() {
        if (curr.length > 0) {
          const n = curr.shift();
          pushToBoard(n);
          setTimeout(function() {
            setNum();
          }, 800);
        } else {
          stopFunc();
        }
      };
      // 开始执行
      setNum();
    }
  }
  
  // 音乐开启/关闭
  function handleToggleMusic() {
    if (document.getElementById('bgm')) {
      $(this).addClass('disabled');
      $('#bgm').remove();
    } else {
      $(this).removeClass('disabled');
      $('body').append(`<embed src="assets/bgm.mp3" loop=true autostart=true hidden=true id="bgm" volume="10"/>`);
    }
  }

  // 底部鼠标移入
  function handleFootEnter() {
    $('#result-btn, #reset-btn').on('mouseout', handleFootLeave).off('mouseenter')
    $(this).css({ opacity: 1 });
  }

  // 底部鼠标移出
  function handleFootLeave() {
    $('#result-btn, #reset-btn').on('mouseenter', handleFootEnter).off('mouseout');
    $(this).css({ opacity: 0 });
  }

  // 重置所有
  function handleReset() {
    data = { pool: _.cloneDeep(global.TJ_2020_BASE_DATA), loted: [] };
    updateData();
  }

  // 查看结果与抽奖面板切换
  function handleToggleResult() {
    $('#result-panel').fadeToggle();
    $('#lot-panel').fadeToggle();
  }

  // 抽奖开始
  function handleLot() {
    // 开始按钮
    const btn = $('#btn-lot');
    // 切抽奖数的select
    const sel = $('#pick-num');
    // 抽奖模式
    const lotType = getLotType();
    // 区分点击开始和结束
    if (btn.attr('class') === 'play') {
      // 将按钮替换为结束按钮
      btn.attr('class', 'stop');
      // 将切抽奖数按钮禁用
      sel.prop('disabled', true);
      // 清空锦鲤池
      $('#board').html('');
      // 开始滚动动画
      toggleLotScroll(lotType, true);
    } else if (btn.attr('class') === 'stop') {
      // 临时将按钮设置为禁用 防止连点
      btn.attr('class', 'play').prop('disabled', true);
      // 停止抽奖（将select取消禁用 并将值传入）
      stopLot(lotType, sel.prop('disabled', false).val());
    }
  }

  // 抽奖模式选择
  function handleChangeLotType() {
    const checkedType = getLotType();

    if (checkedType === 2) {
      $('#lucky-group-disabled').show();
    } else if (checkedType === 0) {
      $('#lucky-group-text').html('?');
      $('#lucky-group-disabled').hide();
    } else {
      $('#lucky-number-text').html('???');
      $('#lucky-group-disabled').hide();
    }
  }

  // main func
  $(doc).ready(function() {
    // 加载缓存数据
    data = loadData();
    // 调整APP尺寸自适应
    const appWidth = $('#app').width();
    const appHeight = $('#app').height();
    const screenWidth = global.innerWidth;
    const screenHeight = global.innerHeight;
    const ratio = Math.min(screenWidth / appWidth, screenHeight / appHeight);
    $('#app').css({
      transform: `scale(${ratio}) translateX(-50%)`
    });
    // 更新初始数据
    updateData();
    // 绑定开始/结束按钮事件
    $('#btn-lot').on('click', handleLot)
    // 绑定重置按钮事件
    $('#reset-btn').on('click', handleReset);
    // 绑定结果按钮事件
    $('#result-btn').on('click', handleToggleResult);
    // 绑定音乐开始与关闭
    $('#btn-bgm').on('click', handleToggleMusic);
    // 绑定切换抽取模式
    $('#lot-type-container > input').on('change', handleChangeLotType)
    // 绑定foot显示/隐藏
    handleFootLeave();
  });
})(window, document, jQuery);