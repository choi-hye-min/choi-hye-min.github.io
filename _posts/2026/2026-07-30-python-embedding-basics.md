---
layout: post
title: "Python으로 이해하는 임베딩 기초와 활용법"
date: 2026-07-30 22:17:30 +0900
categories: [AI, Python]
tags: [AI, Embedding, Python, RAG, Vector Search, OpenAI, Sentence Transformers]
description: "임베딩이 무엇인지 초보자도 이해할 수 있게 설명하고, Python으로 임베딩 생성, 유사도 계산, 벡터 검색, Chroma 활용까지 실습합니다."
---

> 임베딩은 사람이 쓰는 문장을 컴퓨터가 비교할 수 있는 숫자 벡터로 바꾸는 방법입니다.
> 이 글은 임베딩의 개념을 쉬운 비유로 설명한 뒤, Python으로 임베딩을 만들고 비슷한 문장을 찾는 과정을 다룹니다.
> 글을 읽고 나면 검색, 추천, 분류, RAG(Retrieval-Augmented Generation)에서 임베딩을 어떻게 쓰는지 작은 코드로 실험할 수 있습니다.

이 글은 2026년 7월 30일 기준의 OpenAI Embeddings 문서, Sentence Transformers 문서, Chroma 문서를 참고했습니다. 예제는 Python 개발자가 가장 먼저 부딪히는 흐름인 `텍스트 준비 → 임베딩 생성 → 유사도 계산 → 검색 결과 활용`에 초점을 맞춥니다.

## 임베딩이 필요한 이유

컴퓨터는 문장의 뜻을 바로 이해하지 못합니다. 문자열로만 보면 `강아지 사료 추천`과 `반려견 밥 고르기`는 글자가 거의 다릅니다. 하지만 사람은 두 문장이 비슷한 주제라는 것을 압니다. 임베딩은 이런 의미의 가까움을 숫자 공간에서 비교할 수 있게 해 줍니다.

임베딩은 텍스트, 이미지, 오디오 같은 데이터를 숫자 배열로 바꾼 결과입니다. 텍스트 임베딩을 예로 들면 한 문장이 `[0.012, -0.084, 0.331, ...]` 같은 벡터가 됩니다. 벡터의 각 숫자를 사람이 직접 해석하기는 어렵지만, 두 벡터가 가까우면 두 문장의 의미도 비슷할 가능성이 큽니다.

그래서 임베딩은 키워드 검색이 놓치는 문제를 줄이는 데 유용합니다. `환불 정책`이라는 문서가 있을 때 사용자가 `돈을 돌려받는 조건`이라고 검색해도 관련 문서를 찾을 수 있습니다. 단어가 정확히 일치하지 않아도 의미가 가까운지 계산할 수 있기 때문입니다.

## 핵심 개념

임베딩을 처음 배울 때는 다음 네 가지 단어만 먼저 잡으면 됩니다.

| 개념 | 쉬운 설명 | 예시 |
|---|---|---|
| 벡터 | 숫자가 여러 개 들어 있는 배열 | `[0.1, -0.2, 0.7]` |
| 차원 | 벡터 숫자의 개수 | 384차원, 1536차원 |
| 유사도 | 두 벡터가 얼마나 가까운지 | 코사인 유사도 |
| 벡터 검색 | 질문 벡터와 가까운 문서 벡터를 찾는 일 | FAQ 검색, RAG |

차원이 크다고 항상 좋은 것은 아닙니다. 차원이 크면 더 많은 정보를 담을 수 있지만 저장 공간과 계산 비용도 늘어납니다. OpenAI의 `text-embedding-3-small`, `text-embedding-3-large`처럼 모델마다 기본 차원과 비용, 성능 특성이 다르므로 서비스의 정확도와 비용을 같이 봐야 합니다.

유사도는 두 벡터가 얼마나 같은 방향을 바라보는지 계산하는 값입니다. 텍스트 검색에서는 코사인 유사도(cosine similarity)를 자주 사용합니다. 두 문장이 비슷하면 보통 1에 가까운 값이 나오고, 관련이 적으면 낮은 값이 나옵니다. 다만 유사도 점수는 모델과 데이터에 따라 분포가 다르므로 “0.8 이상이면 항상 정답”처럼 고정 기준으로 믿으면 안 됩니다.

## 임베딩은 어떻게 쓰일까

가장 대표적인 활용은 의미 기반 검색입니다. 문서를 미리 임베딩해서 저장해 두고, 사용자의 질문도 임베딩한 뒤 가장 가까운 문서를 찾습니다. 이 방식은 사내 문서 검색, 고객 지원 FAQ, 상품 검색에서 자주 쓰입니다.

두 번째 활용은 추천입니다. 사용자가 본 글, 구매한 상품, 좋아한 콘텐츠를 임베딩으로 표현하고 비슷한 항목을 찾을 수 있습니다. 예를 들어 “Python 입문” 글을 읽은 사용자는 “데이터 분석 기초” 글에도 관심이 있을 가능성이 있습니다.

세 번째 활용은 분류와 클러스터링입니다. 비슷한 문의를 묶어서 어떤 유형이 많은지 보거나, 새 문의가 기존 유형 중 어디에 가까운지 판단할 수 있습니다. 이때 임베딩은 모델 학습을 직접 하지 않아도 데이터를 비교할 수 있는 중간 표현으로 쓰입니다.

마지막으로 RAG에서 중요합니다. RAG는 LLM(Large Language Model)이 답변하기 전에 관련 문서를 검색해 프롬프트에 넣는 패턴입니다. 이때 “어떤 문서를 가져올 것인가”를 정하는 첫 단계에 임베딩 검색이 자주 들어갑니다.

## 예제 환경 준비

이 글의 예제는 두 가지 방식을 보여 줍니다. 하나는 OpenAI API로 임베딩을 만드는 방식이고, 다른 하나는 로컬에서 Sentence Transformers 모델을 사용하는 방식입니다. 운영 서비스에서는 API 기반 모델이 관리 부담을 줄여 주고, 로컬 모델은 데이터 이동을 줄이거나 실험 비용을 낮추는 데 유리할 수 있습니다.

먼저 별도 가상환경을 만들고 필요한 패키지를 설치합니다.

```bash
python -m venv .venv
source .venv/bin/activate
pip install openai numpy sentence-transformers chromadb
```

Windows PowerShell에서는 활성화 명령이 조금 다릅니다.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install openai numpy sentence-transformers chromadb
```

OpenAI API를 사용할 때는 API 키를 환경 변수로 둡니다. 코드에 키를 직접 쓰면 저장소나 로그에 노출될 수 있으므로 피해야 합니다.

```bash
export OPENAI_API_KEY="your-api-key"
```

PowerShell에서는 다음처럼 설정할 수 있습니다.

```powershell
$env:OPENAI_API_KEY="your-api-key"
```

실무에서는 로컬 셸 설정 대신 배포 환경의 secret manager, CI/CD 변수, 클라우드 런타임 환경 변수를 사용합니다. 중요한 점은 API 키가 코드, 테스트 데이터, 블로그 예제에 직접 들어가지 않게 하는 것입니다.

## Python으로 OpenAI 임베딩 만들기

OpenAI 문서의 현재 Python 예제는 `OpenAI` 클라이언트를 만들고 `client.embeddings.create(...)`를 호출하는 방식입니다. 아래 코드는 여러 문장을 한 번에 임베딩합니다. 입력을 배열로 보내면 API 호출 횟수를 줄일 수 있어 작은 배치 처리에 유리합니다.

```python
from openai import OpenAI

client = OpenAI()

texts = [
    "Python으로 데이터를 분석하는 방법",
    "파이썬 pandas 기초 강의",
    "서울에서 맛있는 라멘집 찾기",
]

response = client.embeddings.create(
    model="text-embedding-3-small",
    input=texts,
)

embeddings = [item.embedding for item in response.data]

print(len(embeddings))
print(len(embeddings[0]))
print(embeddings[0][:5])
```

이 코드를 실행하면 문장 개수만큼 임베딩이 만들어집니다. `len(embeddings)`는 입력 문장 수와 같고, `len(embeddings[0])`는 모델이 반환한 벡터 차원입니다. 실제 값은 긴 실수 배열이므로 화면에 전부 출력하기보다 앞부분만 확인하는 편이 좋습니다.

운영 코드에서는 입력이 비어 있거나 너무 긴 경우를 먼저 걸러야 합니다. OpenAI Embeddings API는 입력 길이 제한이 있고, 빈 문자열은 좋은 검색 품질을 만들지 못합니다. 문서나 문의 내용을 임베딩할 때는 문장 하나씩 보내기보다 의미가 유지되는 크기로 나눠서 처리해야 합니다.

## 코사인 유사도로 비슷한 문장 찾기

임베딩을 만들었다면 다음 질문은 “어떻게 비교할 것인가?”입니다. 가장 간단한 방법은 코사인 유사도를 직접 계산하는 것입니다. 아래 예제는 질문 하나와 문서 여러 개의 유사도를 계산해서 가장 가까운 문서를 찾습니다.

```python
from openai import OpenAI
import numpy as np

client = OpenAI()

documents = [
    "Python pandas로 CSV 파일을 읽고 필터링하는 방법",
    "Spring Boot에서 REST API를 만드는 기본 구조",
    "벡터 데이터베이스를 사용해 의미 기반 검색을 구현하는 방법",
    "제주도 2박 3일 여행 코스 추천",
]

query = "파이썬으로 엑셀 같은 표 데이터를 다루고 싶어요"

response = client.embeddings.create(
    model="text-embedding-3-small",
    input=[query, *documents],
)

vectors = [np.array(item.embedding) for item in response.data]
query_vector = vectors[0]
document_vectors = vectors[1:]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


scores = [
    (document, cosine_similarity(query_vector, document_vector))
    for document, document_vector in zip(documents, document_vectors)
]

for document, score in sorted(scores, key=lambda item: item[1], reverse=True):
    print(f"{score:.3f} - {document}")
```

이 예제에서는 `pandas`, `CSV`, `표 데이터`처럼 단어가 완전히 같지 않아도 의미가 가까운 문서가 상위에 나올 가능성이 큽니다. 키워드 검색이었다면 `엑셀`이라는 단어가 없는 문서를 놓칠 수 있지만, 임베딩 검색은 문맥이 가까운지를 봅니다.

실무에서는 이 코드를 그대로 모든 문서에 반복 적용하지 않습니다. 문서가 수천 개 이상이면 매 요청마다 전체 벡터와 비교하는 방식이 느려집니다. 이때 벡터 데이터베이스나 검색 인덱스를 사용해 가까운 후보를 빠르게 찾습니다.

## 로컬 모델로 임베딩 만들기

API를 쓰지 않고 로컬에서 임베딩을 만들 수도 있습니다. Sentence Transformers는 Python에서 임베딩 모델을 쉽게 불러오고 `encode`로 벡터를 만들 수 있는 라이브러리입니다. 인터넷 연결이 필요한 첫 다운로드 이후에는 모델을 로컬 캐시에 두고 사용할 수 있습니다.

아래 코드는 작은 Sentence Transformers 모델로 문장 임베딩을 만들고 유사도를 계산합니다.

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

sentences = [
    "고객이 비밀번호를 잊어버렸을 때 재설정하는 방법",
    "사용자 계정의 패스워드를 다시 설정하는 절차",
    "Docker 컨테이너 로그를 확인하는 명령어",
]

embeddings = model.encode(sentences, normalize_embeddings=True)

similarity_matrix = np.matmul(embeddings, embeddings.T)

print(similarity_matrix)
```

`normalize_embeddings=True`를 사용하면 벡터 길이가 정규화됩니다. 이 경우 두 벡터의 내적이 코사인 유사도처럼 동작하므로 비교 코드가 단순해집니다. 첫 번째 문장과 두 번째 문장은 표현은 다르지만 의미가 비슷하므로 서로 높은 점수를 기대할 수 있습니다.

로컬 모델의 장점은 데이터가 외부 API로 나가지 않는다는 점입니다. 반면 모델 다운로드, 실행 환경, CPU/GPU 성능, 배포 이미지 크기, 모델 업데이트를 직접 관리해야 합니다. 개인 실험이나 내부 도구에는 편하지만, 대규모 운영에서는 성능과 운영 비용을 따져 봐야 합니다.

## 문서를 잘게 나누는 이유

임베딩 검색에서 문서를 통째로 하나의 벡터로 만들면 문제가 생길 수 있습니다. 긴 문서에는 여러 주제가 섞여 있습니다. “설치 방법”, “인증 설정”, “에러 해결”이 한 문서에 들어 있는데 전체를 하나의 벡터로 만들면 사용자의 구체적인 질문과 정확히 맞는 부분을 찾기 어렵습니다.

그래서 보통 문서를 chunk라고 부르는 작은 조각으로 나눕니다. 각 조각은 하나의 의미를 담을 만큼 충분히 크고, 검색 결과로 보여 줄 수 있을 만큼 작아야 합니다. 너무 작으면 문맥이 부족하고, 너무 크면 검색 정확도가 떨어질 수 있습니다.

아래 코드는 단순히 문단 기준으로 텍스트를 나누는 예제입니다. 실제 서비스에서는 Markdown 헤딩, 문장 경계, 코드블록, 표를 고려해 더 정교하게 나누는 편이 좋습니다.

```python
def split_by_paragraph(text: str, min_length: int = 30) -> list[str]:
    paragraphs = [
        paragraph.strip()
        for paragraph in text.split("\n\n")
        if paragraph.strip()
    ]

    chunks: list[str] = []
    buffer = ""

    for paragraph in paragraphs:
        if len(buffer) + len(paragraph) < min_length:
            buffer = f"{buffer}\n\n{paragraph}".strip()
            continue

        if buffer:
            chunks.append(buffer)

        buffer = paragraph

    if buffer:
        chunks.append(buffer)

    return chunks


sample = """
임베딩은 텍스트를 벡터로 바꾸는 방법입니다.

벡터 검색은 질문 벡터와 가까운 문서 벡터를 찾습니다.

RAG는 검색된 문서를 LLM 입력에 함께 넣어 답변의 근거로 사용합니다.
"""

print(split_by_paragraph(sample))
```

이 코드는 학습용으로 단순화했습니다. 운영에서는 chunk마다 원본 문서 ID, 제목, URL, 섹션 제목, 업데이트 시간 같은 메타데이터를 함께 저장해야 합니다. 검색 결과가 나왔을 때 사용자가 원문으로 이동하거나, 오래된 문서를 제외하거나, 특정 제품군 문서만 필터링해야 하기 때문입니다.

## Chroma로 작은 벡터 검색 만들기

문서가 많아지면 벡터를 파일이나 리스트에만 두기 어렵습니다. Chroma 같은 벡터 데이터베이스는 문서, 메타데이터, 임베딩을 컬렉션 단위로 저장하고 질의할 수 있게 해 줍니다. 아래 예제는 로컬 메모리에서 간단한 컬렉션을 만들고 검색하는 흐름입니다.

```python
import chromadb
from chromadb.utils import embedding_functions

openai_embedding_function = embedding_functions.OpenAIEmbeddingFunction(
    api_key_env_var="OPENAI_API_KEY",
    model_name="text-embedding-3-small",
)

client = chromadb.Client()
collection = client.create_collection(
    name="tech_notes",
    embedding_function=openai_embedding_function,
)

collection.add(
    ids=["note-1", "note-2", "note-3"],
    documents=[
        "pandas는 Python에서 표 형태 데이터를 다루는 라이브러리입니다.",
        "Spring Boot는 Java 기반 웹 애플리케이션을 빠르게 만들 수 있게 도와줍니다.",
        "RAG는 검색된 문서를 LLM 프롬프트에 함께 넣는 패턴입니다.",
    ],
    metadatas=[
        {"category": "python"},
        {"category": "java"},
        {"category": "ai"},
    ],
)

result = collection.query(
    query_texts=["파이썬으로 데이터프레임을 다루는 법"],
    n_results=2,
)

print(result["ids"])
print(result["documents"])
```

이 예제에서는 Chroma가 컬렉션의 embedding function을 사용해 문서와 질의를 임베딩합니다. 직접 만든 임베딩을 넣는 방식도 가능하지만, 컬렉션 안에서 같은 모델을 일관되게 쓰는 편이 실수를 줄이기 쉽습니다.

실무에서는 `chromadb.Client()` 같은 메모리 클라이언트 대신 영속 저장소나 서버 모드를 사용해야 합니다. 또한 같은 컬렉션 안에는 같은 임베딩 모델과 같은 차원의 벡터를 넣어야 합니다. 모델을 바꾸면 기존 문서 임베딩도 다시 생성하는 것을 원칙으로 보는 편이 안전합니다.

## 검색 결과를 LLM에 연결하는 방법

임베딩 검색은 답변을 직접 생성하지 않습니다. 검색 결과로 “관련 있을 가능성이 높은 문서 조각”을 찾을 뿐입니다. RAG에서는 이 조각을 LLM 프롬프트에 넣고, 모델에게 근거 안에서 답하게 합니다.

아래 코드는 검색 결과를 프롬프트 재료로 만드는 최소 예시입니다. 실제 LLM 호출 코드는 생략하고, 검색된 문서를 어떻게 묶는지에 집중합니다.

```python
def build_context(documents: list[str]) -> str:
    blocks = []

    for index, document in enumerate(documents, start=1):
        blocks.append(f"[문서 {index}]\n{document}")

    return "\n\n".join(blocks)


retrieved_documents = [
    "pandas의 read_csv 함수는 CSV 파일을 DataFrame으로 읽습니다.",
    "DataFrame의 query 메서드는 조건 문자열로 행을 필터링합니다.",
]

question = "CSV 파일에서 특정 조건의 행만 보고 싶어요."
context = build_context(retrieved_documents)

prompt = f"""
아래 문서만 근거로 사용해 질문에 답하세요.
문서에 없는 내용은 모른다고 답하세요.

{context}

질문:
{question}
"""

print(prompt)
```

이 흐름에서 중요한 점은 “검색 품질”과 “생성 품질”을 분리해서 봐야 한다는 것입니다. 답변이 틀렸다면 모델이 잘못 생성했을 수도 있지만, 애초에 필요한 문서를 검색하지 못했을 수도 있습니다. 운영에서는 정답 문서가 상위 K개 안에 들어왔는지와 최종 답변이 근거를 잘 사용했는지를 따로 평가해야 합니다.

## 모델 선택 기준

임베딩 모델을 고를 때는 정확도만 보지 말고 비용, 지연 시간, 언어, 운영 방식도 함께 봐야 합니다. 특히 한국어 문서를 다룬다면 한국어 검색 품질을 실제 데이터로 확인해야 합니다. 영어 벤치마크에서 좋은 모델이 내 한국어 사내 문서에서도 항상 좋은 것은 아닙니다.

| 기준 | 확인할 질문 | 실무 판단 |
|---|---|---|
| 언어 | 한국어와 영어가 섞여 있는가? | 다국어 성능을 실제 질의로 평가 |
| 비용 | 문서 재색인과 질의량이 얼마나 되는가? | 배치 크기와 캐시 전략 필요 |
| 지연 시간 | 검색이 사용자 요청 경로에 있는가? | API 호출, 인덱스 검색 시간 측정 |
| 운영 | 모델을 직접 배포할 수 있는가? | API형과 로컬형의 관리 비용 비교 |
| 차원 | 저장 공간과 검색 비용이 부담되는가? | 차원 축소 옵션이나 작은 모델 검토 |

처음에는 작고 저렴한 모델로 시작해 평가 데이터를 만드는 편이 좋습니다. 모델을 고르기 전에 “좋은 검색 결과”가 무엇인지 샘플 질문과 정답 문서 목록을 만들어야 합니다. 그래야 모델 변경이 실제로 좋아졌는지 알 수 있습니다.

## 자주 하는 실수와 주의사항

### 키워드 검색을 완전히 버린다

임베딩 검색은 의미가 가까운 문서를 찾는 데 강하지만, 정확한 식별자 검색에는 약할 수 있습니다. 주문번호, 에러 코드, API 이름, 파일명처럼 정확히 일치해야 하는 값은 키워드 검색이 더 좋을 때가 많습니다. 실무 검색은 키워드 검색과 벡터 검색을 함께 쓰는 하이브리드 방식이 자주 필요합니다.

### 문서를 너무 크게 임베딩한다

긴 문서 하나를 통째로 임베딩하면 구체적인 질문과 맞는 부분을 찾기 어렵습니다. 사용자가 “설치 중 인증 오류”를 물었는데 전체 설치 가이드가 검색되면 LLM은 불필요한 문맥까지 받습니다. 섹션 단위, 문단 단위, 의미 단위로 나누고 검색 결과에 원문 위치를 함께 저장해야 합니다.

### 모델을 바꾸고 기존 벡터를 그대로 쓴다

임베딩 벡터는 모델이 만든 좌표계 안에서 의미가 있습니다. 다른 모델로 만든 벡터를 같은 컬렉션에 섞으면 거리 계산이 깨질 수 있습니다. 모델을 바꿀 때는 컬렉션 이름이나 버전을 분리하고, 기존 문서도 새 모델로 다시 임베딩하는 전략을 세워야 합니다.

### 유사도 점수를 절대 기준으로 믿는다

유사도 점수는 모델, 데이터, 정규화 방식, 검색 인덱스 설정에 따라 달라집니다. `0.75 이상이면 관련 문서` 같은 기준은 반드시 실제 데이터로 보정해야 합니다. 특히 FAQ처럼 짧은 문서와 매뉴얼처럼 긴 문서가 섞이면 점수 분포가 다르게 나올 수 있습니다.

### 개인정보와 내부 문서를 무심코 보낸다

외부 API를 사용할 때는 입력 텍스트가 외부 서비스로 전송됩니다. 개인정보, 영업비밀, 고객 데이터가 포함된 문서를 임베딩할 때는 회사 정책과 공급자 약관, 보안 요구사항을 먼저 확인해야 합니다. 필요하면 익명화, 필드 제거, 로컬 모델 사용, 전용 배포 환경을 검토합니다.

## 실무 적용 체크리스트

작은 프로젝트에 임베딩 검색을 넣는다면 다음 순서로 진행하는 편이 안전합니다.

1. 사용자가 실제로 물을 질문 20개를 모읍니다.
2. 각 질문에 대해 찾아야 하는 정답 문서나 섹션을 표시합니다.
3. 문서를 적절한 chunk로 나누고 메타데이터를 붙입니다.
4. 하나의 임베딩 모델로 전체 문서를 색인합니다.
5. 질문을 임베딩해 상위 3개 또는 5개 결과를 확인합니다.
6. 정답 문서가 상위 결과에 들어오는 비율을 측정합니다.
7. 실패 사례를 보고 chunk 크기, 메타데이터, 하이브리드 검색을 조정합니다.
8. 모델을 바꿀 때는 같은 평가 질문으로 전후를 비교합니다.
9. 운영에서는 색인 버전, 모델 이름, 문서 업데이트 시간을 로그로 남깁니다.
10. RAG에 연결할 때는 검색 평가와 답변 평가를 분리합니다.

이 체크리스트의 핵심은 감으로 모델을 고르지 않는 것입니다. 임베딩 검색은 데모에서는 쉽게 좋아 보이지만, 운영에서는 “찾아야 하는 문서를 안정적으로 찾는가?”가 전부입니다. 작은 평가 세트라도 있으면 모델, chunk, 검색 설정을 바꿀 때 판단 기준이 생깁니다.

## 언제 임베딩을 쓰지 말아야 할까

임베딩은 만능 검색 도구가 아닙니다. 정확한 필터링과 정렬이 중요한 업무에는 일반 데이터베이스 쿼리가 더 적합합니다. 예를 들어 `2026년 7월 결제 실패 건 중 금액이 10만 원 이상인 주문`은 SQL이나 검색 엔진의 필터 조건으로 처리해야 합니다.

또한 최신 상태가 중요한 트랜잭션 데이터도 벡터 인덱스에만 의존하면 안 됩니다. 계좌 잔액, 주문 상태, 권한 정보는 원본 시스템을 조회해야 합니다. 임베딩 인덱스는 주로 읽을 자료를 찾는 용도이며, 정합성이 필요한 원장 역할을 대신하지 않습니다.

마지막으로 정답 근거를 설명해야 하는 규제 환경에서는 검색 결과의 출처와 버전을 반드시 남겨야 합니다. 임베딩은 관련 문서를 찾는 데 도움을 주지만, 왜 그 문서가 선택됐는지 사람이 완전히 해석하기는 어렵습니다. 그래서 감사가 필요한 시스템에서는 원문 링크, 문서 버전, 검색 시점, 사용한 모델 버전을 함께 기록해야 합니다.

## 결론 및 도움말

> 임베딩은 문장을 숫자 벡터로 바꿔서 의미의 가까움을 계산하게 해 주는 기술입니다. Python에서는 OpenAI API나 Sentence Transformers로 쉽게 시작할 수 있고, 코사인 유사도와 벡터 데이터베이스를 연결하면 작은 의미 기반 검색을 만들 수 있습니다.
>
> 실무에서 중요한 것은 모델 이름보다 데이터 준비와 검증입니다. 문서를 잘게 나누고, 같은 모델로 일관되게 색인하고, 실제 질문으로 검색 품질을 평가하세요. 임베딩은 좋은 RAG의 출발점이지만, 검색 실패와 오래된 문서, 개인정보 노출 같은 운영 문제까지 함께 설계해야 안전하게 쓸 수 있습니다.

## 참고자료/레퍼런스

- [OpenAI Platform Docs: Vector embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- [OpenAI API Reference: Create embeddings](https://developers.openai.com/api/reference/resources/embeddings/methods/create/)
- [OpenAI API Reference: Python library](https://developers.openai.com/api/reference/python/)
- [Sentence Transformers Documentation](https://sbert.net/)
- [SentenceTransformer model reference](https://sbert.net/docs/package_reference/sentence_transformer/model.html)
- [Chroma Docs: Getting Started](https://docs.trychroma.com/docs/overview/getting-started)
- [Chroma Docs: Query and Get](https://docs.trychroma.com/docs/querying-collections/query-and-get)
- [Chroma Docs: OpenAI embedding function](https://docs.trychroma.com/integrations/embedding-models/openai)
