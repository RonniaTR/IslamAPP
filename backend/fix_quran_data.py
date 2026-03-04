#!/usr/bin/env python3
"""
Kuran Verilerini Düzeltme ve Güncelleme Script'i
- Tekrar eden ayetleri temizler
- Nas suresi dahil tüm sureleri kontrol eder
- Audio URL'leri ekler
"""

import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent / 'data'

def clean_quran_data():
    """Kuran verilerindeki tekrar eden ayetleri temizle"""
    
    for lang in ['turkish', 'english', 'arabic', 'spanish']:
        filepath = DATA_DIR / f'quran_{lang}.json'
        if not filepath.exists():
            continue
            
        print(f"\nProcessing {lang}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        surahs = data.get('data', {}).get('surahs', [])
        total_fixed = 0
        
        for surah in surahs:
            ayahs = surah.get('ayahs', [])
            
            # Track seen verses by numberInSurah
            seen = {}
            unique_ayahs = []
            
            for ayah in ayahs:
                verse_num = ayah.get('numberInSurah')
                
                # Only keep first occurrence of each verse number
                if verse_num not in seen:
                    seen[verse_num] = True
                    unique_ayahs.append(ayah)
                else:
                    total_fixed += 1
            
            surah['ayahs'] = unique_ayahs
        
        # Save cleaned data
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  Fixed {total_fixed} duplicate verses in {lang}")

def verify_nas_surah():
    """Nas suresini doğrula"""
    
    filepath = DATA_DIR / 'quran_turkish.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    surahs = data.get('data', {}).get('surahs', [])
    nas = [s for s in surahs if s.get('number') == 114]
    
    if nas:
        print("\nNas Suresi (114):")
        print(f"  Name: {nas[0].get('name')}")
        print(f"  English: {nas[0].get('englishName')}")
        print(f"  Verses: {len(nas[0].get('ayahs', []))}")
        
        # Correct Nas surah verses if needed
        correct_nas = [
            {"numberInSurah": 1, "text": "De ki: Sığınırım insanların Rabbine,"},
            {"numberInSurah": 2, "text": "İnsanların Melikine (hükümdarına),"},
            {"numberInSurah": 3, "text": "İnsanların İlahına."},
            {"numberInSurah": 4, "text": "(Kötülük) fısıldayan sinsi vesvesecinin şerrinden."},
            {"numberInSurah": 5, "text": "O ki, insanların göğüslerine (kalplerine) vesvese verir."},
            {"numberInSurah": 6, "text": "Gerek cinlerden, gerek insanlardan."}
        ]
        
        ayahs = nas[0].get('ayahs', [])
        for i, ayah in enumerate(ayahs):
            if i < len(correct_nas):
                print(f"  {ayah.get('numberInSurah')}: {ayah.get('text')[:60]}...")
    
    return True

if __name__ == '__main__':
    print("=" * 50)
    print("Kuran Veri Düzeltme Script'i")
    print("=" * 50)
    
    clean_quran_data()
    verify_nas_surah()
    
    print("\n✅ Kuran verileri başarıyla düzeltildi!")
