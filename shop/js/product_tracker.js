/**
 * 유저의 행동에 따른 상품 데이터 수집
 * 
 * 1. 클릭 이벤트 attachOnClickEvent
 * 2. 노출 이벤트 trackImpression
 */
class ProductTracker {
    constructor($list_wrap = null) {
        // $list_wrap이 전달되지 않았거나 유효하지 않은 경우 document 사용
        this.$list_wrap = $list_wrap || $(document);
        
        // jQuery 객체가 아닌 경우 jQuery로 변환
        if (this.$list_wrap && typeof this.$list_wrap.jquery === 'undefined') {
            this.$list_wrap = $(this.$list_wrap);
        }
        
        this.impressedProducts = [];
        this.debounceTimer = null;       // Debounce 타이머 ID
        this.DEBOUNCE_DELAY = 1000;      // Debounce 지연 시간 (밀리초)
        this.debouncedTrackImpression = null; // Debounced 함수를 저장할 속성
    }

    init() {
        if (typeof BrandScope === 'undefined') {
            throw new Error('BrandScope is undefined');
        }

        this.debouncedTrackImpression = () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.trackImpression();
            }, this.DEBOUNCE_DELAY);
        }

        this.attachOnClickEvent();
        this.observeImpression();
    }

    attachOnClickEvent() {
        this.$list_wrap.find('._shop_item').one('mouseup', function(e) {
            // 마우스 왼쪽 또는 휠 클릭이 아니면 이벤트 종료
            if (e.which !== 1 && e.which !== 2) { 
                return;
            }

            const productData = $(this).data('product-properties');

            if (productData === undefined) {
                throw new Error('productData is undefined');
            } 

            BrandScope.track({
                eventType: 'Select',
                props: {
                    ownership: 'behavior-tracking-analytics',
                    selectedType: 'PRODUCT',
                    selectedNo: productData.idx,
                    selectedCode: productData.code,
                    selectedName: productData.name,
                    selectedImageUrl: productData.image_url,
                    productPrice: productData.price,
                    productOriginPrice: productData.original_price,
                }
            });
        });
    }

    trackImpression() {
        const productsToTrack = [...this.impressedProducts];

        if (productsToTrack.length === 0) {
            return;
        }

        this.impressedProducts = [];

        const data = productsToTrack.map(product => ({
            productNo: product.idx,
            productCode: product.code,
            productName: product.name,
            productImageUrl: product.image_url,
            productPrice: product.price,
            productOriginPrice: product.original_price,
        }))

        BrandScope.track({
            eventType: 'ProductImpression',
            props: {
                ownership: 'behavior-tracking-analytics',
                impressedTarget: 'product_item',
                impressionType: 'PRODUCT',
                products: data
            }
        });
    }

    /**
     * 노출 추적 관찰자 설정
     * DELAY 이상 노출 된 상품에 대해서만 노출 추적 이벤트 발생
     */
    observeImpression() {
        const DELAY = 500;
        const intersectionTimer = new Map(); // 각 상품의 타이머를 저장할 Map

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                try {
                    const productData = JSON.parse(entry.target.dataset.productProperties);

                    const idx = productData.idx;

                    if (idx === undefined) {
                        return;
                    }
                    
                    if (entry.isIntersecting) {
                        if (intersectionTimer.has(idx)) {
                            return;
                        }

                        intersectionTimer.set(idx, setTimeout(() => {
                            this.impressedProducts.push(productData);

                            if (this.impressedProducts.length > 0) {
                                this.debouncedTrackImpression();
                            }

                            observer.unobserve(entry.target);
                        }, DELAY));

                    } else {
                        if (!intersectionTimer.has(idx)) {
                            return;
                        }

                        clearTimeout(intersectionTimer.get(idx));
                        intersectionTimer.delete(idx);
                    }
                } catch (_) {
                    // 오류 발생 시 무시
                }
            });
        }, {
            threshold: 0.8
        });

        const shopItems = this.$list_wrap.find('._shop_item');
        
        shopItems.each(function(){
            observer.observe($(this)[0]);
        });
    }
}
