import concurrent.futures
import json
import logging
import os
import re
import grpc
from dotenv import load_dotenv
from google import genai
from google.genai import types

import finai_service_pb2
import finai_service_pb2_grpc

# .env dosyasındaki değişkenleri yükle
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY .env dosyasında bulunamadı!")

# Gemini istemcisini başlat
client = genai.Client(api_key=GEMINI_API_KEY)


class FinAiServiceServicer(finai_service_pb2_grpc.FinAiServiceServicer):

    def ParseTransaction(self, request, context):
        logger.info(f"Harcama ayrıştırma isteği alındı. User ID: {request.user_id}, Text: {request.input_text}")

        prompt = f"""
        Aşağıdaki Türkçe metni analiz et ve harcama/gelir verisini JSON formatında çıkar:
        Metin: "{request.input_text}"

        Lütfen SADECE aşağıdaki JSON formatında yanıt ver (başka açıklama ekleme):
        {{
            "intent": "EXPENSE" veya "INCOME",
            "amount": float_deger,
            "category": "Gıda/Market", "Ulaşım", "Eğlence", "Fatura", "Giyim", "Teknoloji", "Diğer" vb.,
            "merchant_or_title": "Firma veya başlık adı",
            "confidence_score": 0.0 - 1.0 arası değer
        }}
        """

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )

            response_text = response.text.strip()
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                parsed_data = json.loads(json_match.group(0))

                return finai_service_pb2.TransactionResponse(
                    is_successful=True,
                    intent=parsed_data.get("intent", "EXPENSE"),
                    amount=float(parsed_data.get("amount", 0.0)),
                    category=parsed_data.get("category", "Diğer"),
                    merchant_or_title=parsed_data.get("merchant_or_title", "Bilinmeyen"),
                    confidence_score=float(parsed_data.get("confidence_score", 0.95))
                )

        except Exception as e:
            logger.error(f"Gemini API Ayrıştırma Hatası: {e}")
            # Akıllı Yerel Kural Tabanlı Fallback Ayrıştırıcı (Gemini 503 yüksek yoğunluk durumunda devrededir)
            try:
                text = request.input_text.strip()
                # Tutar yakalama (örn: 530, 530tl, 530 lira, 1250.50)
                amount_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:tl|lira|₺)?', text, re.IGNORECASE)
                amount = float(amount_match.group(1).replace(',', '.')) if amount_match else 0.0

                # Mağaza ve kategori tespiti
                text_lower = text.lower()
                category = "Diğer"
                intent = "EXPENSE"
                merchant = "Harcama"

                if "trendyol" in text_lower:
                    merchant = "Trendyol"
                    category = "Giyim"
                elif "hepsiburada" in text_lower:
                    merchant = "Hepsiburada"
                    category = "Teknoloji"
                elif "amazon" in text_lower:
                    merchant = "Amazon"
                    category = "Teknoloji"
                elif "starbucks" in text_lower:
                    merchant = "Starbucks"
                    category = "Gıda/Market"
                elif "migros" in text_lower or "bim" in text_lower or "a101" in text_lower or "market" in text_lower:
                    merchant = "Süpermarket"
                    category = "Gıda/Market"
                elif "maaş" in text_lower or "gelir" in text_lower:
                    intent = "INCOME"
                    merchant = "Gelir Kaynağı"
                    category = "Gelir"
                else:
                    # İlk kelimeyi işyeri yap
                    words = text.split()
                    if words:
                        merchant = words[0].capitalize()

                if amount > 0:
                    logger.info(f"Fallback Ayrıştırıcı Başarıyla Çalıştı: {merchant} - ₺{amount} - {category}")
                    return finai_service_pb2.TransactionResponse(
                        is_successful=True,
                        intent=intent,
                        amount=amount,
                        category=category,
                        merchant_or_title=merchant,
                        confidence_score=0.90
                    )
            except Exception as fallback_err:
                logger.error(f"Fallback ayrıştırma hatası: {fallback_err}")

        return finai_service_pb2.TransactionResponse(is_successful=False)

    def GenerateFinancialInsight(self, request, context):
        logger.info(f"Finansal analiz isteği alındı. User ID: {request.user_id}")

        prompt = f"""
        Sen uzman bir finansal danışman ve bütçe analistisin.
        Kullanıcının harcama özeti aşağıdaki gibidir (JSON formatında):
        {request.transactions_summary_json}

        Bu veriyi analiz ederek kullanıcıya finansal durum değerlendirmesi yap.
        Lütfen SADECE aşağıdaki JSON formatında yanıt ver (başka metin ekleme):
        {{
            "insight_text": "Kullanıcıya özel 2-3 cümlelik samimi ve profesyonel genel durum değerlendirmesi.",
            "risk_level": "Low", "Medium" veya "High",
            "recommendations": [
                "Tavsiye 1 (örn: Gıda harcamalarını kısıtlayarak bu ay tasarruf edebilirsin)",
                "Tavsiye 2",
                "Tavsiye 3"
            ]
        }}
        """

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )

            response_text = response.text.strip()
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))

                return finai_service_pb2.InsightResponse(
                    insight_text=data.get("insight_text", "Harcama verileriniz başarıyla analiz edildi."),
                    risk_level=data.get("risk_level", "Low"),
                    recommendations=data.get("recommendations", [])
                )

        except Exception as e:
            logger.error(f"Gemini Insight Hatası: {e}")

        return finai_service_pb2.InsightResponse(
            insight_text="Henüz analiz oluşturulacak yeterli veri bulunmuyor.",
            risk_level="Low",
            recommendations=["Düzenli harcama girerek AI tavsiyelerini aktifleştirebilirsiniz."]
        )

    def ChatWithAdvisor(self, request, context):
        logger.info(f"Yapay zeka finansal danışman sohbet isteği alındı. User ID: {request.user_id}")

        # Sohbet geçmişini Gemini formatına dönüştür
        gemini_history = []
        for msg in request.history:
            gemini_history.append({
                "role": msg.role if msg.role in ["user", "model"] else "user",
                "parts": [{"text": msg.content}]
            })

        # RAG (Retrieval-Augmented Generation) Bağlamını Zenginleştir
        context_info = ""
        if request.context_json:
            try:
                parsed_context = json.loads(request.context_json)
                context_info = "\n\n--- KULLANICI FİNANSAL RAG BAĞLAMI ---\n"
                if isinstance(parsed_context, list):
                    for item in parsed_context:
                        category = item.get("category", "Diğer")
                        limit = item.get("limitAmount", 0.0)
                        spent = item.get("currentSpent", 0.0)
                        pct = item.get("percentage", 0.0)
                        context_info += f"- {category}: Limit: ₺{limit}, Harcanan: ₺{spent}, Doluluk: %{pct}\n"
                elif isinstance(parsed_context, dict):
                    context_info += json.dumps(parsed_context, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.error(f"RAG finansal bağlam JSON ayrıştırma hatası: {e}")

        system_instruction = f"""
        Sen FinAI uygulamasında yer alan son derece bilgili, samimi, profesyonel ve proaktif bir kişisel finans danışmanı yapay zekasısın (RAG AI Financial Advisor).
        Kullanıcının canlı bütçe durumuna, hedeflerine ve harcama alışkanlıklarına göre ona kişiselleştirilmiş tasarruf ve finansal tavsiyeler ver.
        {context_info}
        ÖNEMLİ KURALLAR:
        1. Yanıtlarında ASLA ham markdown sembolleri (örneğin **, #, *, _) KULLANMA. Yanıtların düzgün, kurallı ve akıcı Türkçe cümlelerden oluşmalıdır.
        2. Cümlelerin gramer açısından kusursuz, samimi, nazik ve anlaşılır olmasını sağla.
        3. Konuları maddeler halinde sunarken yıldız koyma, doğrudan düzenli cümleler kur.
        """

        try:
            # Gemini sohbetini başlat
            chat = client.chats.create(
                model="gemini-flash-latest",
                config={
                    "system_instruction": system_instruction
                },
                history=gemini_history
            )

            # Yanıt üret
            response = chat.send_message(request.message)
            reply_text = response.text.strip()
            # Temizlik (Ham Markdown yıldızlarını ve kareleri temizle)
            reply_text = re.sub(r'\*\*(.*?)\*\*', r'\1', reply_text)
            reply_text = reply_text.replace('**', '').replace('##', '').replace('#', '')
            return finai_service_pb2.ChatResponse(reply=reply_text)

        except Exception as e:
            logger.error(f"Gemini Chat Hatası: {e}")
            return finai_service_pb2.ChatResponse(reply="Üzgünüm, şu an finansal analiz motoruna erişemiyorum. Lütfen daha sonra tekrar deneyin.")

    def ExtractReceiptData(self, request, context):
        logger.info(f"Fiş OCR analizi isteği alındı. User ID: {request.user_id}")

        prompt = """
        Aşağıdaki fiş/fatura görselini analiz et ve bilgileri JSON formatında çıkar:

        Lütfen SADECE aşağıdaki JSON formatında yanıt ver (başka metin veya açıklama ekleme):
        {
            "merchant_name": "Mağaza/Firma Adı",
            "total_amount": float_deger,
            "category": "Gıda/Market", "Ulaşım", "Eğlence", "Fatura", "Giyim", "Teknoloji" veya "Diğer",
            "date_str": "YYYY-MM-DD",
            "items": [
                {"name": "Ürün 1", "price": float_deger},
                {"name": "Ürün 2", "price": float_deger}
            ],
            "confidence_score": 0.0 - 1.0 arası değer
        }
        """

        try:
            image_part = types.Part.from_bytes(
                data=request.image_bytes,
                mime_type=request.mime_type or "image/jpeg"
            )

            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=[image_part, prompt]
            )

            response_text = response.text.strip()
            logger.info(f"Gemini Receipt OCR ham yanit: {response_text!r}")
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))

                return finai_service_pb2.ReceiptResponse(
                    is_successful=True,
                    merchant_name=data.get("merchant_name", "Bilinmeyen"),
                    total_amount=float(data.get("total_amount", 0.0)),
                    category=data.get("category", "Diğer"),
                    date_str=data.get("date_str", ""),
                    items_json=json.dumps(data.get("items", [])),
                    confidence_score=float(data.get("confidence_score", 0.9))
                )
            else:
                logger.error("Gemini Receipt OCR: yanitta JSON bulunamadi")

        except Exception as e:
            logger.error(f"Gemini Receipt OCR Hatası: {e}")

        return finai_service_pb2.ReceiptResponse(is_successful=False)

    def DetectRecurringPayments(self, request, context):
        logger.info(f"Tekrarlayan ödeme tespiti isteği alındı. User ID: {request.user_id}")

        prompt = f"""
        Aşağıdaki geçmiş harcama ve işlem verilerini (JSON) analiz et:
        {request.transactions_json}

        Abonelikleri, faturaları, düzenli kiraları veya tekrarlayan ödemeleri tespit et.
        Lütfen SADECE aşağıdaki JSON formatında bir liste yanıtı ver (başka açıklama ekleme):
        [
            {{
                "merchant_name": "Netflix / Spotify / Kira / Elektrik vb.",
                "amount": float_deger,
                "category": "Eğlence" veya "Fatura" veya "Diğer",
                "frequency": "Monthly" veya "Weekly" veya "Yearly",
                "next_due_date": "YYYY-MM-DD"
            }}
        ]
        """

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )

            response_text = response.text.strip()
            json_match = re.search(r"\[.*\]", response_text, re.DOTALL)
            if json_match:
                detected_list = json.loads(json_match.group(0))

                return finai_service_pb2.RecurringPaymentsResponse(
                    is_successful=True,
                    detected_subscriptions_json=json.dumps(detected_list)
                )

        except Exception as e:
            logger.error(f"Gemini DetectRecurringPayments Hatası: {e}")

        return finai_service_pb2.RecurringPaymentsResponse(
            is_successful=False,
            detected_subscriptions_json="[]"
        )

    def DetectAnomalies(self, request, context):
        logger.info(f"Anomali tespiti isteği alındı. User ID: {request.user_id}")

        prompt = f"""
        Aşağıdaki kullanıcının son harcama işlemlerini (JSON) incele:
        {request.transactions_json}

        Olağandışı yüksek tutarlı harcamaları veya anormal kategorideki işlemleri tespit et.
        Lütfen SADECE aşağıdaki JSON formatında bir liste yanıtı ver (başka metin ekleme):
        [
            {{
                "title": "Olağanüstü Yüksek Harcama",
                "message": "Detaylı açıklama metni",
                "type": "ANOMALY"
            }}
        ]
        """

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )

            response_text = response.text.strip()
            json_match = re.search(r"\[.*\]", response_text, re.DOTALL)
            if json_match:
                anomalies_list = json.loads(json_match.group(0))

                return finai_service_pb2.AnomalyResponse(
                    is_successful=True,
                    anomalies_json=json.dumps(anomalies_list)
                )

        except Exception as e:
            logger.error(f"Gemini DetectAnomalies Hatası: {e}")

        return finai_service_pb2.AnomalyResponse(
            is_successful=False,
            anomalies_json="[]"
        )

    def CalculateGoalProjection(self, request, context):
        logger.info(f"Hedef projeksiyonu isteği alındı. Title: {request.goal_title}, Target: {request.target_amount}")

        prompt = f"""
        Finansal hedef analizi yap:
        Target Title: {request.goal_title}
        Target Amount: {request.target_amount} TL
        Current Savings: {request.current_amount} TL
        Deadline Date: {request.deadline_date}

        Kalan tutarı hesaba katarak hedefe ulaşmak için gereken aylık tasarruf miktarını ve yapıcı tavsiyeleri içeren bir JSON yanıtı üret:
        Lütfen SADECE aşağıdaki JSON formatında yanıt ver:
        {{
            "estimated_completion_date": "YYYY-MM-DD",
            "recommended_monthly_saving": float_deger,
            "advice_text": "Tavsiye metni"
        }}
        """

        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )

            response_text = response.text.strip()
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))

                return finai_service_pb2.GoalProjectionResponse(
                    is_successful=True,
                    estimated_completion_date=data.get("estimated_completion_date", request.deadline_date),
                    recommended_monthly_saving=float(data.get("recommended_monthly_saving", 0.0)),
                    advice_text=data.get("advice_text", "Hedefinize adım adım ilerliyorsunuz!")
                )

        except Exception as e:
            logger.error(f"Gemini GoalProjection Hatası: {e}")

        return finai_service_pb2.GoalProjectionResponse(is_successful=False)


def serve():
    server = grpc.server(concurrent.futures.ThreadPoolExecutor(max_workers=10))
    finai_service_pb2_grpc.add_FinAiServiceServicer_to_server(FinAiServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    logger.info("FinAI Python gRPC Servisi 50051 portunda başlatılıyor...")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()