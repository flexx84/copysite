// BrandScope 초기화 및 메서드 사용을 위한 래퍼 함수
(function (window, document, script, BrandScope, firstScript) {
	window.BrandScope = window.BrandScope || {
		init: function () {
			(window.BrandScope.q = window.BrandScope.q || [])
				.push(['init'].concat(Array.prototype.slice.call(arguments)))
		},
		identify: function () {
			(window.BrandScope.q = window.BrandScope.q || [])
				.push(['identify'].concat(Array.prototype.slice.call(arguments)))
		},
		track: function () {
			(window.BrandScope.q = window.BrandScope.q || [])
				.push(['track'].concat(Array.prototype.slice.call(arguments)))
		},
		getImwebClientInfo: function () {
			(window.BrandScope.q = window.BrandScope.q || [])
				.push(['getImwebClientInfo'].concat(Array.prototype.slice.call(arguments)))
		},
		sessionResetByLogout: function () {
			(window.BrandScope.q = window.BrandScope.q || [])
				.push(['sessionResetByLogout'].concat(Array.prototype.slice.call(arguments)))
		},
	}

	// BrandScope SDK 스크립트 로드
	BrandScope = window.BrandScope
	// BrandScope 스크립트 동적 로딩
	script = document.createElement('script')
	script.type = 'module'
	script.async = true
	script.src = (typeof TEST_SERVER !== 'undefined' && TEST_SERVER)
		? '//cdn-brandscope.imtest.me/bs.esm.js'
		: '//static.imweb.me/brand-scope/bs.esm.js';
	// BrandScope 스크립트 삽입
	firstScript = document.getElementsByTagName('script')[0]
	firstScript.parentNode.insertBefore(script, firstScript)
})(window, document);


// 상품 페이지 여부 확인 및 BrandScope 초기화
const isProductPage = () => {
	const goodsWrapper = document.querySelectorAll('.goods_wrapper')[0];
	if (!goodsWrapper) return false;

	try {
		const productData = JSON.parse(goodsWrapper.dataset.productProperties);
		return productData && Object.keys(productData).length > 0;
	} catch (error) {
		console.error('상품 데이터 파싱 중 오류 발생:', error);
		return false;
	}
};

// 상품 페이지인 경우에만 상품 데이터를 포함하여 초기화
if (isProductPage()) {
	const goodsWrapper = document.querySelectorAll('.goods_wrapper')[0];
	const productData = JSON.parse(goodsWrapper.dataset.productProperties);

	BrandScope.init({
		props: {
			ownership: 'behavior-tracking-analytics',
			product: {
				productNo: productData.idx,
				productCode: productData.code,
				productName: productData.name,
				productImageUrl: productData.image_url,
				productPrice: productData.price,
				productOriginPrice: productData.original_price,
			}
		}
	});
} else {
	// 상품 페이지가 아닌 경우 기본 초기화
	BrandScope.init({
		props: {
			ownership: 'behavior-tracking-analytics',
		}
	});
}
