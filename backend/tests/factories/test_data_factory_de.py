"""
Testdaten-Fabrik basierend auf klassischen Werken (Deutsche Version)
"""

from typing import List, Dict, Any


class ChekhovTestDataFactoryDE:
    """
    Fabrik erstellt Testdaten für Projekte basierend auf
    Tschechows klassischen Geschichten (gemeinfrei) - Deutsche Version
    """
    
    @staticmethod
    def get_chameleon_project() -> Dict[str, Any]:
        """
        Projekt basierend auf der Geschichte 'Das Chamäleon'
        Komödie über einen Polizeiinspektor und einen Hund
        ALLE ROLLEN aus der Geschichte
        """
        return {
            'request_text': '''
            Schauspieler-Casting für Filmadaptation der Komödie "Das Chamäleon" von A.P. Tschechow.
            
            ROLLE 1: Polizeiinspektor Otschumelow - Mann 45-55 Jahre alt,
            komödiantisches Talent, Fähigkeit Unterwürfigkeit und Stimmungswechsel zu zeigen.
            Größe 175-180 cm, volle Figur, Kleidergröße 52-54.
            Erfahrung in Komödienrollen erforderlich.
            Gage: 25000 Rubel/Schicht.
            
            ROLLE 2: Polizist Jeldyrin - Mann 30-40 Jahre alt, große Größe 180-190 cm,
            kräftiger Körperbau. Fähigkeit Haltung zu bewahren, militärisches Auftreten.
            Gauge: 18000 Rubel/Schicht.
            
            ROLLE 3: Goldschmied Chrjukin - Mann 35-45 Jahre alt,
            einfach aussehend, Fähigkeit Opfer zu spielen. Größe 165-175 cm.
            Gauge: 20000 Rubel/Schicht.
            
            ROLLE 4: General Schigalow - Mann 55-65 Jahre alt, imposantes Aussehen,
            militärisches Auftreten. Nebenrolle.
            Gauge: 15000 Rubel/Schicht.
            
            ROLLE 5: Passant aus der Menge - Mann jedes Alters, Statisten.
            Gauge: 5000 Rubel/Schicht.
            
            ROLLE 6: Köchin (aus der Menge) - Frau 40-55 Jahre alt, einfaches Aussehen.
            Gauge: 5000 Rubel/Schicht.
            
            Dreharbeiten in Moskau, Juli 2025.
            
            Casting-Direktorin: Elena Iwanowa
            Regisseur: Michail Petrow
            Produzent: Wladimir Sidorow
            Firma: Tschechow Filmadaptationen
            ''',
            'project_data': {
                'title': 'Das Chamäleon',
                'project_type': 'Kurzfilm',
                'genre': 'Komödie',
                'description': 'Filmadaptation von A.P. Tschechows klassischer Geschichte über einen Polizeiinspektor',
                'premiere_date': '2025-09-01',
            },
            'roles': [
                {
                    'character_name': 'Polizeiinspektor Otschumelow',
                    'role_type': 'Schauspieler',
                    'description': 'Hauptrolle. Polizeiinspektor geht über Marktplatz und sieht Menschenmenge. Untersucht Hundebiss-Vorfall. Ändert ständig seine Meinung darüber, ob der Hund schuldig ist, je nachdem wem er gehört. Droht zuerst Hundebesitzer zu bestrafen, erfährt dann dass es der Hund des Generals ist und ändert sofort Position. Schlüsselszenen: Verhör von Chrjukin, Gespräch mit Menge, Momente wenn er Mantel aus- und anzieht vor Aufregung.',
                    'age_min': 45,
                    'age_max': 55,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '175-180 cm',
                    'body_type': 'Voll',
                    'hair_color': 'Dunkel mit Grau',
                    'clothing_size': '52-54',
                    'shoe_size': '42-43',
                    'nationality': 'Russisch',
                    'rate_per_shift': '25000 Rubel',
                    'shooting_dates': 'Juli 2025',
                    'shooting_location': 'Moskau',
                    'skills_required': ['Schauspielkunst', 'Komödie'],
                    'special_conditions': 'Erfahrung in Komödienrollen erforderlich',
                    'reference_text': 'Beamter aus spätem 19. Jahrhundert, unterwürfig und Meinung wechselnd',
                    'audition_requirements': 'Otschumelows Monolog mit Stimmungswechseln vorbereiten',
                    'audition_text': 'Szene wenn Otschumelow erfährt dass Hund dem General gehört und Entscheidung ändert',
                    'notes': 'Zentrale Komödienrolle, erfordert exzellentes Timing',
                },
                {
                    'character_name': 'Polizist Jeldyrin',
                    'role_type': 'Schauspieler',
                    'description': 'Otschumelows Assistent. Folgt schweigend Inspektor durch ganze Szene, trägt beschlagnahmte Stachelbeeren in Sieb. Hat keine Repliken aber ist ständig präsent, hilft Otschumelow Mantel aus- und anzuziehen.',
                    'age_min': 30,
                    'age_max': 40,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '180-190 cm',
                    'body_type': 'Kräftig',
                    'hair_color': 'Dunkel',
                    'clothing_size': '50',
                    'shoe_size': '43-44',
                    'rate_per_shift': '18000 Rubel',
                    'shooting_dates': 'Juli 2025',
                    'shooting_location': 'Moskau',
                    'skills_required': ['Schauspielkunst'],
                    'special_conditions': 'Fähigkeit Haltung zu bewahren, militärisches Auftreten',
                    'notes': 'Rolle ohne Worte aber wichtige Bildschirmpräsenz',
                },
                {
                    'character_name': 'Goldschmied Chrjukin',
                    'role_type': 'Schauspieler',
                    'description': 'Hundebiss-Opfer. Zeigt gebissenen Finger, beschwert sich bei Otschumelow, fordert Gerechtigkeit. Schlüsselszene: zeigt Finger und beschreibt wie Hund ihn biss. Sollte gleichzeitig Mitleid und Komik hervorrufen. Bleibt am Ende mit nichts als sich herausstellt dass Hund dem General gehört.',
                    'age_min': 35,
                    'age_max': 45,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '165-175 cm',
                    'body_type': 'Durchschnittlich',
                    'hair_color': 'Hellbraun',
                    'clothing_size': '48',
                    'rate_per_shift': '20000 Rubel',
                    'shooting_dates': 'Juli 2025',
                    'shooting_location': 'Moskau',
                    'skills_required': ['Schauspielkunst'],
                    'audition_requirements': 'Komische Beschwerdeszene über Biss zeigen',
                    'audition_text': 'Chrjukins Monolog darüber wie Hund ihn biss',
                    'notes': 'Wichtig - komische Darbietung in dramatischer Situation',
                },
                {
                    'character_name': 'General Schigalow',
                    'role_type': 'Schauspieler',
                    'description': 'General, Hundebesitzer. Nebenrolle. Erscheint in Schlussszene als sich herausstellt dass Hund ihm gehört. Sein Bruder wird im Dialog als Besitzer eines Barsoi-Hundes erwähnt. General muss Eindruck eines hochrangigen pensionierten Militäroffiziers machen vor dem alle zittern.',
                    'age_min': 55,
                    'age_max': 65,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'height': '175-185 cm',
                    'body_type': 'Voll',
                    'hair_color': 'Grau',
                    'clothing_size': '54',
                    'rate_per_shift': '15000 Rubel',
                    'shooting_dates': 'Juli 2025',
                    'shooting_location': 'Moskau',
                    'skills_required': ['Schauspielkunst'],
                    'special_conditions': 'Militärisches Auftreten, imposante Erscheinung',
                    'audition_requirements': 'Autorität und Macht nur durch Erscheinung zeigen',
                    'reference_text': 'Bild eines russischen Generals aus spätem 19. Jahrhundert Oberschicht',
                },
                {
                    'character_name': 'Passant aus Menge',
                    'role_type': 'Statisten',
                    'description': 'Einer der Zuschauer die Vorfall beobachten',
                    'age_min': 25,
                    'age_max': 60,
                    'gender': 'male',
                    'media_presence': 'doesnt_matter',
                    'rate_per_shift': '5000 Rubel',
                    'shooting_dates': 'Juli 2025',
                    'shooting_location': 'Moskau',
                    'skills_required': ['Schauspielkunst'],
                },
                {
                    'character_name': 'Köchin',
                    'role_type': 'Statisten',
                    'description': 'Frau aus Zuschauermenge',
                    'age_min': 40,
                    'age_max': 55,
                    'gender': 'female',
                    'media_presence': 'doesnt_matter',
                    'height': '160-170 cm',
                    'body_type': 'Voll',
                    'clothing_size': '48',
                    'rate_per_shift': '5000 Rubel',
                    'shooting_dates': 'Juli 2025',
                    'shooting_location': 'Moskau',
                    'skills_required': ['Schauspielkunst'],
                },
            ],
            'contacts': {
                'casting_director': {'name': 'Elena Iwanowa'},
                'director': {'name': 'Michail Petrow'},
                'producers': [{'name': 'Wladimir Sidorow'}],
                'production_company': {'name': 'Tschechow Filmadaptationen'},
            }
        }
    
    @staticmethod
    def get_all_test_projects() -> List[Dict[str, Any]]:
        """Gibt alle Testprojekte zurück"""
        return [
            ChekhovTestDataFactoryDE.get_chameleon_project(),
        ]

