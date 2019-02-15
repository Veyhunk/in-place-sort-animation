class SwapAspect {
    constructor(frameFunc) {
        if (!frameFunc || typeof frameFunc !== 'function')
            throw new Error(frameFunc + ' is not a function!');
        this.frameFunc = frameFunc;
        this.queue = [];
        this.counter = 0;
    }

    swap(a, i, j) {
        if (i === j)
            return;
        const temp = a[i];
        a[i] = a[j];
        a[j] = temp;
        this.queue.push(a.slice());
        this.counter++;
    }

    clear() {
        this.counter = 0;
        this.queue.length = 0;
    }

    showProcess() {
        const queue = this.queue;
        const frameFunc = this.frameFunc;
        const sortAnimationFrame = function () {
            const a = queue.shift();
            if (a) {
                frameFunc(a);
                requestAnimationFrame(sortAnimationFrame);
            }
        };
        requestAnimationFrame(sortAnimationFrame);
        return this.counter;
    }
}


(function (echarts) {
    'use strict';

    const commonOption = {
            backgroundColor: '#0f375f',
            xAxis: {
                type: 'category'
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                type: 'bar',
                itemStyle: {
                    normal: {
                        barBorderRadius: 5,
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1,
                            [
                                {offset: 0, color: '#14c8d4'},
                                {offset: 1, color: '#43eec6'}
                            ]
                        )
                    },
                    emphasis: {
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1,
                            [
                                {offset: 0, color: '#2378f7'},
                                {offset: 0.7, color: '#2378f7'},
                                {offset: 1, color: '#83bff6'}
                            ]
                        )
                    }
                }
            }],
            animation: false
        }
    ;

    const initEcharts = function (domId) {
        const handle = echarts.init(document.getElementById(domId), {renderer: 'svg'});
        handle.resize();
        handle.setOption(commonOption);
        return handle;
    };

    const bubbleHandle = initEcharts('bubble-echarts');
    const selectionHandle = initEcharts('selection-echarts');
    const insertionHandle = initEcharts('insertion-echarts');
    const quickHandle = initEcharts('quick-echarts');
    const heapHandle = initEcharts('heap-echarts');
    const combHandle = initEcharts('comb-echarts');

    const animationInProcessQueue = [];

    const sortWeaver = function (handle, sortFunc) {
        const frameFunc = function (a) {
            const option = {
                series: {
                    data: a
                }
            };
            handle.setOption(option);
        };
        const swapAspect = new SwapAspect(frameFunc);
        return function (a) {
            if (!Array.isArray(a))
                return;
            handle.clear();
            handle.setOption(commonOption);
            frameFunc(a);
            sortFunc(a, swapAspect);
            animationInProcessQueue.push(swapAspect);
            swapAspect.showProcess();
        };

    };


    const bubbleSort = sortWeaver(bubbleHandle, function (a, swapAspect) {
        const len = a.length;
        for (let i = len - 1; i > 0; i--) {
            for (let j = 0; j < i; j++) {
                if (a[j] > a[j + 1]) {
                    swapAspect.swap(a, j + 1, j);
                }
            }
        }
    });


    const selectionSort = sortWeaver(selectionHandle, function (a, swapAspect) {
        const len = a.length;
        for (let i = len - 1; i > 0; i--) {
            let maxJ = i;
            for (let j = 0; j < i; j++) {
                if (a[j] > a[maxJ]) {
                    maxJ = j;
                }
            }
            swapAspect.swap(a, maxJ, i);
        }
    });

    const insertionSort = sortWeaver(insertionHandle, function (a, swapAspect) {
        const len = a.length;
        for (let i = 1; i < len; i++) {
            for (let j = i; j > 0 && a[j] < a[j - 1]; j--)
                swapAspect.swap(a, j, j - 1);
        }
    });

    const quickSort = sortWeaver(quickHandle, function (a, swapAspect) {
        quickSort0(a, 0, a.length - 1, swapAspect);
    });

    const quickSort0 = function (a, left, right, swapAspect) {
        if (left >= right)
            return;
        const pivotIndex = (left + right) >>> 1;
        const pivotNewIndex = partition(a, left, right, pivotIndex, swapAspect);
        quickSort0(a, left, pivotNewIndex - 1, swapAspect);
        quickSort0(a, pivotNewIndex + 1, right, swapAspect);
    };

    const partition = function (a, left, right, pivotIndex, swapAspect) {
        const pivot = a[pivotIndex];
        swapAspect.swap(a, pivotIndex, right);
        let storeIndex = left;
        for (let i = left; i < right; i++) {
            if (a[i] < pivot) {
                swapAspect.swap(a, storeIndex++, i);
            }
        }
        swapAspect.swap(a, storeIndex, right);
        return storeIndex;
    };


    const heapSort = sortWeaver(heapHandle, function (a, swapAspect) {
        const len = a.length;
        for (let i = (len >>> 1) - 1; i >= 0; i--)
            maxHeapify(a, i, len - 1, swapAspect);
        for (let i = len - 1; i > 0; i--) {
            swapAspect.swap(a, 0, i);
            maxHeapify(a, 0, i - 1, swapAspect);
        }
    });

    const maxHeapify = function (a, start, end, swapAspect) {
        let parent = start;
        let child = (parent << 1) + 1;
        while (child <= end) {
            if (child + 1 <= end && a[child] < a[child + 1])
                child += 1;
            if (a[parent] > a[child])
                return;
            else {
                swapAspect.swap(a, parent, child);
                parent = child;
                child = (parent << 1) + 1;
            }
        }
    };

    const combSort = sortWeaver(combHandle, function (a, swapAspect) {
        const len = a.length;
        const shrinkFactor = 0.8;
        let gap = len, swapped = true;
        while (gap > 1 || swapped) {
            if (gap > 1)
                gap = Math.trunc(gap * shrinkFactor);
            swapped = false;
            for (let i = 0; i + gap < len; i++) {
                if (a[i] > a[i + gap]) {
                    swapAspect.swap(a, i, i + gap);
                    swapped = true;
                }
            }
        }
    });


    document.addEventListener('DOMContentLoaded', function () {
        const sizeInput = document.getElementById('array-size-input');
        document.getElementById('run-animation-btn').addEventListener('click', function (e) {
            const size = parseInt(sizeInput.value);
            if (!Number.isInteger(size) || size <= 0) {
                sizeInput.focus();
                e.preventDefault();
                return;
            }
            while (animationInProcessQueue.length > 0) {
                const aspect = animationInProcessQueue.shift();
                aspect.clear();
            }
            const a = new Array(size);
            for (let i = 0; i < a.length; i++)
                a[i] = Math.random();

            bubbleSort(a.slice());
            selectionSort(a.slice());
            insertionSort(a.slice());
            quickSort(a.slice());
            heapSort(a.slice());
            combSort(a.slice());
        });
    });

    window.addEventListener('resize', function () {
        bubbleHandle.resize();
        insertionHandle.resize();
        selectionHandle.resize();
        quickHandle.resize();
        heapHandle.resize();
        combHandle.resize();
    });

})(echarts);